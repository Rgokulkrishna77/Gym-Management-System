-- ============================================================
--  Gym Management System - MySQL 8 schema + sample data
--  Run with the mysql CLI (the procedure uses DELIMITER):
--     mysql -u root -p < database/schema.sql
-- ============================================================
DROP DATABASE IF EXISTS gym_db;
CREATE DATABASE gym_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE gym_db;

-- ------------------------------------------------------------
-- users: one row per login account (all four roles)
-- ------------------------------------------------------------
CREATE TABLE users (
  user_id       INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name          VARCHAR(100) NOT NULL,
  email         VARCHAR(150) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role          ENUM('member','trainer','receptionist','admin') NOT NULL,
  phone         VARCHAR(15)  NOT NULL,
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_users_email UNIQUE (email),
  CONSTRAINT chk_users_phone CHECK (phone REGEXP '^[0-9+ -]{7,15}$')
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- trainers
-- ------------------------------------------------------------
CREATE TABLE trainers (
  trainer_id       INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id          INT UNSIGNED NOT NULL,
  specialization   VARCHAR(100) NOT NULL,
  experience_years TINYINT UNSIGNED NOT NULL DEFAULT 0,
  CONSTRAINT uq_trainers_user UNIQUE (user_id),
  CONSTRAINT fk_trainers_user FOREIGN KEY (user_id)
    REFERENCES users(user_id) ON DELETE CASCADE,
  CONSTRAINT chk_trainers_exp CHECK (experience_years <= 60)
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- members
-- member_code is the human-friendly unique Member ID (e.g. GYM00012).
-- It is generated from the auto-increment key inside the
-- registration transaction (see server/src/controllers/memberController.js).
-- ------------------------------------------------------------
CREATE TABLE members (
  member_id   INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  member_code VARCHAR(12) NULL,
  user_id     INT UNSIGNED NOT NULL,
  age         TINYINT UNSIGNED NOT NULL,
  address     VARCHAR(255) NOT NULL,
  join_date   DATE NOT NULL DEFAULT (CURRENT_DATE),
  trainer_id  INT UNSIGNED NULL,
  CONSTRAINT uq_members_code UNIQUE (member_code),
  CONSTRAINT uq_members_user  UNIQUE (user_id),
  CONSTRAINT fk_members_user FOREIGN KEY (user_id)
    REFERENCES users(user_id) ON DELETE CASCADE,
  -- deleting a trainer must not delete members: just unassign them
  CONSTRAINT fk_members_trainer FOREIGN KEY (trainer_id)
    REFERENCES trainers(trainer_id) ON DELETE SET NULL,
  CONSTRAINT chk_members_age CHECK (age BETWEEN 12 AND 100)
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- membership_plans
-- ------------------------------------------------------------
CREATE TABLE membership_plans (
  plan_id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  plan_name       VARCHAR(60) NOT NULL,
  duration_months TINYINT UNSIGNED NOT NULL,
  fee             DECIMAL(10,2) NOT NULL,
  description     VARCHAR(255) NULL,
  CONSTRAINT uq_plan_name UNIQUE (plan_name),
  CONSTRAINT chk_plan_duration CHECK (duration_months BETWEEN 1 AND 60),
  CONSTRAINT chk_plan_fee CHECK (fee > 0)
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- memberships: one row per purchased/renewed period
-- ------------------------------------------------------------
CREATE TABLE memberships (
  membership_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  member_id     INT UNSIGNED NOT NULL,
  plan_id       INT UNSIGNED NOT NULL,
  start_date    DATE NOT NULL,
  expiry_date   DATE NOT NULL,
  status        ENUM('active','expired','cancelled') NOT NULL DEFAULT 'active',
  CONSTRAINT fk_ms_member FOREIGN KEY (member_id)
    REFERENCES members(member_id) ON DELETE CASCADE,
  -- a plan that has memberships cannot be deleted (history must stay valid)
  CONSTRAINT fk_ms_plan FOREIGN KEY (plan_id)
    REFERENCES membership_plans(plan_id) ON DELETE RESTRICT,
  CONSTRAINT chk_ms_dates CHECK (expiry_date > start_date),
  INDEX idx_ms_member (member_id),
  INDEX idx_ms_expiry (expiry_date)
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- payments
-- ------------------------------------------------------------
CREATE TABLE payments (
  payment_id     INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  membership_id  INT UNSIGNED NOT NULL,
  amount         DECIMAL(10,2) NOT NULL,
  payment_date   DATE NOT NULL DEFAULT (CURRENT_DATE),
  method         ENUM('cash','card','upi','online') NOT NULL,
  payment_status ENUM('paid','pending','failed') NOT NULL DEFAULT 'paid',
  CONSTRAINT fk_pay_ms FOREIGN KEY (membership_id)
    REFERENCES memberships(membership_id) ON DELETE CASCADE,
  CONSTRAINT chk_pay_amount CHECK (amount > 0),
  INDEX idx_pay_date (payment_date)
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- workout plans
-- ------------------------------------------------------------
CREATE TABLE workout_plans (
  workout_id  INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  member_id   INT UNSIGNED NOT NULL,
  trainer_id  INT UNSIGNED NULL,
  title       VARCHAR(120) NOT NULL,
  description TEXT NULL,
  start_date  DATE NOT NULL,
  end_date    DATE NOT NULL,
  updated_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_wp_member FOREIGN KEY (member_id)
    REFERENCES members(member_id) ON DELETE CASCADE,
  CONSTRAINT fk_wp_trainer FOREIGN KEY (trainer_id)
    REFERENCES trainers(trainer_id) ON DELETE SET NULL,
  CONSTRAINT chk_wp_dates CHECK (end_date >= start_date),
  INDEX idx_wp_member (member_id)
) ENGINE=InnoDB;

CREATE TABLE workout_plan_items (
  item_id       INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  workout_id    INT UNSIGNED NOT NULL,
  exercise_name VARCHAR(100) NOT NULL,
  sets          TINYINT UNSIGNED NOT NULL,
  reps          SMALLINT UNSIGNED NOT NULL,
  day           ENUM('Mon','Tue','Wed','Thu','Fri','Sat','Sun') NOT NULL,
  CONSTRAINT fk_wpi_workout FOREIGN KEY (workout_id)
    REFERENCES workout_plans(workout_id) ON DELETE CASCADE,
  CONSTRAINT chk_wpi_sets CHECK (sets BETWEEN 1 AND 20),
  CONSTRAINT chk_wpi_reps CHECK (reps BETWEEN 1 AND 500),
  INDEX idx_wpi_workout (workout_id)
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- VIEW: latest membership per member that has expired
-- (a member with a newer, still-valid membership is NOT listed)
-- ------------------------------------------------------------
CREATE VIEW v_expired_memberships AS
SELECT m.member_id, m.member_code, u.name, u.email, u.phone,
       ms.membership_id, p.plan_id, p.plan_name, p.fee,
       ms.expiry_date, DATEDIFF(CURRENT_DATE, ms.expiry_date) AS days_expired
FROM members m
JOIN users u ON u.user_id = m.user_id
JOIN memberships ms ON ms.membership_id = (
       SELECT x.membership_id FROM memberships x
       WHERE x.member_id = m.member_id
       ORDER BY x.expiry_date DESC, x.membership_id DESC LIMIT 1)
JOIN membership_plans p ON p.plan_id = ms.plan_id
WHERE ms.expiry_date < CURRENT_DATE AND ms.status <> 'cancelled';

-- ------------------------------------------------------------
-- STORED PROCEDURE: renew a membership atomically
--   * new period starts today if expired, otherwise the day after the
--     current expiry (so no paid days are lost)
--   * expiry_date = start + plan duration
--   * a payment row is recorded in the same transaction
-- ------------------------------------------------------------
DELIMITER $$
CREATE PROCEDURE sp_renew_membership(
  IN  p_member_id INT UNSIGNED,
  IN  p_plan_id   INT UNSIGNED,
  IN  p_method    VARCHAR(10),
  OUT o_membership_id INT UNSIGNED,
  OUT o_new_expiry    DATE,
  OUT o_amount        DECIMAL(10,2)
)
BEGIN
  DECLARE v_months TINYINT UNSIGNED;
  DECLARE v_last_expiry DATE;
  DECLARE v_start DATE;

  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    ROLLBACK;
    RESIGNAL;
  END;

  START TRANSACTION;

  SELECT duration_months, fee INTO v_months, o_amount
    FROM membership_plans WHERE plan_id = p_plan_id;
  IF v_months IS NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Plan not found';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM members WHERE member_id = p_member_id) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Member not found';
  END IF;

  SELECT MAX(expiry_date) INTO v_last_expiry
    FROM memberships WHERE member_id = p_member_id AND status <> 'cancelled' FOR UPDATE;

  SET v_start = IF(v_last_expiry IS NULL OR v_last_expiry < CURRENT_DATE,
                   CURRENT_DATE, DATE_ADD(v_last_expiry, INTERVAL 1 DAY));
  SET o_new_expiry = DATE_ADD(v_start, INTERVAL v_months MONTH);

  -- mark older memberships as expired
  UPDATE memberships SET status = 'expired'
   WHERE member_id = p_member_id AND status = 'active' AND expiry_date < CURRENT_DATE;

  INSERT INTO memberships (member_id, plan_id, start_date, expiry_date, status)
  VALUES (p_member_id, p_plan_id, v_start, o_new_expiry, 'active');
  SET o_membership_id = LAST_INSERT_ID();

  INSERT INTO payments (membership_id, amount, payment_date, method, payment_status)
  VALUES (o_membership_id, o_amount, CURRENT_DATE, p_method, 'paid');

  COMMIT;
END$$
DELIMITER ;

-- ============================================================
--  SAMPLE DATA   (every password below is:  Password@123)
-- ============================================================
SET @pw = '$2b$10$Kt0JdxMQyBkOkmx9tZR/a.OiPWwPcWs3JPmSZCza.9Gd.cxzRIJvq';

INSERT INTO users (name, email, password_hash, role, phone) VALUES
 ('Aarav Admin',      'admin@gym.com',        @pw, 'admin',        '9000000001'),
 ('Riya Reception',   'reception@gym.com',    @pw, 'receptionist', '9000000002'),
 ('Tom Trainer',      'trainer@gym.com',      @pw, 'trainer',      '9000000003'),
 ('Sara Strength',    'sara.trainer@gym.com', @pw, 'trainer',      '9000000004'),
 ('Maya Member',      'member@gym.com',       @pw, 'member',       '9000000005'),
 ('Expired Eddie',    'expired@gym.com',      @pw, 'member',       '9000000006'),
 ('Nina Newbie',      'nina@gym.com',         @pw, 'member',       '9000000007');

INSERT INTO trainers (user_id, specialization, experience_years) VALUES
 (3, 'Strength & Conditioning', 8),
 (4, 'Yoga & Mobility', 5);

INSERT INTO membership_plans (plan_name, duration_months, fee, description) VALUES
 ('Monthly',   1,  1500.00, 'Gym floor access, locker and basic equipment'),
 ('Quarterly', 3,  4000.00, 'Everything in Monthly + 1 free trainer session'),
 ('Half-Year', 6,  7500.00, 'Everything in Quarterly + diet consultation'),
 ('Annual',   12, 13000.00, 'Best value: all facilities + personal training discount');

INSERT INTO members (user_id, age, address, join_date, trainer_id) VALUES
 (5, 28, '12 Lake View Road, Trivandrum', DATE_SUB(CURRENT_DATE, INTERVAL 2 MONTH), 1),
 (6, 35, '4 Hill Street, Kochi',          DATE_SUB(CURRENT_DATE, INTERVAL 5 MONTH), 2),
 (7, 22, '88 Park Avenue, Kollam',        CURRENT_DATE,                             NULL);

UPDATE members SET member_code = CONCAT('GYM', LPAD(member_id, 5, '0'));

INSERT INTO memberships (member_id, plan_id, start_date, expiry_date, status) VALUES
 (1, 2, DATE_SUB(CURRENT_DATE, INTERVAL 2 MONTH), DATE_ADD(CURRENT_DATE, INTERVAL 1 MONTH), 'active'),
 (2, 1, DATE_SUB(CURRENT_DATE, INTERVAL 5 MONTH), DATE_SUB(CURRENT_DATE, INTERVAL 4 MONTH), 'expired'),
 (3, 1, CURRENT_DATE, DATE_ADD(CURRENT_DATE, INTERVAL 1 MONTH), 'active');

INSERT INTO payments (membership_id, amount, payment_date, method, payment_status) VALUES
 (1, 4000.00, DATE_SUB(CURRENT_DATE, INTERVAL 2 MONTH), 'upi',  'paid'),
 (2, 1500.00, DATE_SUB(CURRENT_DATE, INTERVAL 5 MONTH), 'cash', 'paid'),
 (3, 1500.00, CURRENT_DATE, 'online', 'pending');

INSERT INTO workout_plans (member_id, trainer_id, title, description, start_date, end_date) VALUES
 (1, 1, 'Beginner Strength Block', 'Focus on form. Rest 60-90s between sets.',
  CURRENT_DATE, DATE_ADD(CURRENT_DATE, INTERVAL 28 DAY));

INSERT INTO workout_plan_items (workout_id, exercise_name, sets, reps, day) VALUES
 (1, 'Barbell Squat', 4, 8,  'Mon'),
 (1, 'Bench Press',   4, 8,  'Wed'),
 (1, 'Deadlift',      3, 5,  'Fri'),
 (1, 'Plank',         3, 60, 'Sat');
