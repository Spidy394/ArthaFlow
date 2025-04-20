-- Enable Row Level Security (RLS) on all tables
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE point_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies for transactions table
CREATE POLICY "Users can view own transactions"
ON transactions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own transactions"
ON transactions FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own transactions"
ON transactions FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own transactions"
ON transactions FOR DELETE
USING (auth.uid() = user_id);

-- Create RLS Policies for budgets table
CREATE POLICY "Users can view own budgets"
ON budgets FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own budgets"
ON budgets FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own budgets"
ON budgets FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own budgets"
ON budgets FOR DELETE
USING (auth.uid() = user_id);

-- Create RLS Policies for goals table
CREATE POLICY "Users can view own goals"
ON goals FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own goals"
ON goals FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own goals"
ON goals FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own goals"
ON goals FOR DELETE
USING (auth.uid() = user_id);

-- Create RLS Policies for user_points table
CREATE POLICY "Users can view own points"
ON user_points FOR SELECT
USING (auth.uid() = user_id);

-- Create RLS Policies for point_history table
CREATE POLICY "Users can view own point history"
ON point_history FOR SELECT
USING (auth.uid() = user_id);

-- Create RLS Policies for user_badges table
CREATE POLICY "Users can view own badges"
ON user_badges FOR SELECT
USING (auth.uid() = user_id);

-- Create RLS Policies for notifications table
CREATE POLICY "Users can view own notifications"
ON notifications FOR SELECT
USING (auth.uid() = user_id);

-- Create RLS Policies for challenges table
CREATE POLICY "Users can view own challenges"
ON challenges FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own challenges"
ON challenges FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own challenges"
ON challenges FOR UPDATE
USING (auth.uid() = user_id);

-- Create RLS Policies for profiles table
CREATE POLICY "Users can view own profile"
ON profiles FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
USING (auth.uid() = id);

-- Public can view badges
CREATE POLICY "Public can view badges"
ON badges FOR SELECT
USING (true);

-- Function to update user points when a transaction is added
CREATE OR REPLACE FUNCTION update_user_points()
RETURNS TRIGGER AS $$
DECLARE
  point_amount INT;
  current_level INT;
  new_level INT;
  user_current_points INT;
BEGIN
  -- Only award points for completed transactions
  IF NEW.type = 'expense' THEN
    point_amount := FLOOR(NEW.amount * 0.1)::INT;
  ELSE
    point_amount := FLOOR(NEW.amount * 0.05)::INT;
  END IF;
  
  -- Add point history record
  INSERT INTO point_history (user_id, amount, description)
  VALUES (NEW.user_id, point_amount, 
    CASE 
      WHEN NEW.type = 'expense' THEN 'Points for tracking expense'
      ELSE 'Points for recording income'
    END
  );
  
  -- Get current points or initialize with 0
  SELECT points, level INTO user_current_points, current_level
  FROM user_points
  WHERE user_id = NEW.user_id;
  
  -- Calculate new level based on points (every 1000 points = 1 level)
  IF NOT FOUND THEN
    user_current_points := 0;
    current_level := 1;
  END IF;
  
  user_current_points := user_current_points + point_amount;
  new_level := FLOOR(user_current_points / 1000) + 1;
  
  -- Update or insert user_points
  INSERT INTO user_points (user_id, points, level, updated_at)
  VALUES (NEW.user_id, user_current_points, new_level, NOW())
  ON CONFLICT (user_id)
  DO UPDATE SET 
    points = user_current_points,
    level = new_level,
    updated_at = NOW();
    
  -- Create notification for level up
  IF new_level > current_level THEN
    INSERT INTO notifications (user_id, title, message, type)
    VALUES (
      NEW.user_id,
      'Level Up!',
      'Congratulations! You have reached level ' || new_level,
      'achievement'
    );
  END IF;
    
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for points update
DROP TRIGGER IF EXISTS update_points_on_transaction ON transactions;
CREATE TRIGGER update_points_on_transaction
AFTER INSERT ON transactions
FOR EACH ROW
EXECUTE FUNCTION update_user_points();

-- Function to check budget limits
CREATE OR REPLACE FUNCTION check_budget_limits()
RETURNS TRIGGER AS $$
DECLARE
  budget_limit DECIMAL;
  current_total DECIMAL;
  percent_used DECIMAL;
BEGIN
  -- Only check budgets for expenses
  IF NEW.type = 'expense' THEN
    -- Get budget limit for the category
    SELECT target_amount INTO budget_limit
    FROM budgets
    WHERE user_id = NEW.user_id 
    AND category = NEW.category
    AND DATE_TRUNC('month', start_date) <= DATE_TRUNC('month', NEW.transaction_date)
    AND DATE_TRUNC('month', end_date) >= DATE_TRUNC('month', NEW.transaction_date);
    
    IF FOUND THEN
      -- Calculate current total for the month
      SELECT COALESCE(SUM(amount), 0) INTO current_total
      FROM transactions
      WHERE user_id = NEW.user_id 
      AND category = NEW.category
      AND type = 'expense'
      AND DATE_TRUNC('month', transaction_date) = DATE_TRUNC('month', NEW.transaction_date);
      
      -- Calculate percent used
      percent_used := ((current_total + NEW.amount) / budget_limit) * 100;
      
      -- Create notification if over budget
      IF percent_used >= 100 THEN
        INSERT INTO notifications (user_id, title, message, type)
        VALUES (
          NEW.user_id,
          'Budget Alert',
          'You have exceeded your budget for ' || NEW.category,
          'warning'
        );
      -- Create notification if approaching budget limit
      ELSIF percent_used >= 80 THEN
        INSERT INTO notifications (user_id, title, message, type)
        VALUES (
          NEW.user_id,
          'Budget Warning',
          'You have used ' || ROUND(percent_used) || '% of your budget for ' || NEW.category,
          'info'
        );
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for budget check
DROP TRIGGER IF EXISTS check_budget_on_transaction ON transactions;
CREATE TRIGGER check_budget_on_transaction
AFTER INSERT ON transactions
FOR EACH ROW
EXECUTE FUNCTION check_budget_limits();

-- Function to award badges
CREATE OR REPLACE FUNCTION check_and_award_badges()
RETURNS TRIGGER AS $$
DECLARE
  badge_id UUID;
  transaction_count INT;
  saving_streak INT;
  budget_count INT;
BEGIN
  -- Check for First Transaction badge
  SELECT id INTO badge_id
  FROM badges
  WHERE name = 'First Transaction' OR requirement = 'first_transaction'
  LIMIT 1;
  
  IF FOUND THEN
    SELECT COUNT(*) INTO transaction_count
    FROM transactions
    WHERE user_id = NEW.user_id;
    
    IF transaction_count = 1 THEN
      INSERT INTO user_badges (user_id, badge_id, awarded_at)
      VALUES (NEW.user_id, badge_id, NOW())
      ON CONFLICT DO NOTHING;
      
      -- Add notification
      INSERT INTO notifications (user_id, title, message, type)
      VALUES (
        NEW.user_id,
        'Badge Earned',
        'You earned the "First Transaction" badge!',
        'achievement'
      );
    END IF;
  END IF;
  
  -- Check for Budget Master badge
  SELECT id INTO badge_id
  FROM badges
  WHERE name = 'Budget Master' OR requirement = 'budget_master'
  LIMIT 1;
  
  IF FOUND AND NEW.type = 'expense' THEN
    SELECT COUNT(*) INTO budget_count
    FROM budgets
    WHERE user_id = NEW.user_id;
    
    IF budget_count >= 3 THEN
      INSERT INTO user_badges (user_id, badge_id, awarded_at)
      VALUES (NEW.user_id, badge_id, NOW())
      ON CONFLICT DO NOTHING;
      
      -- Add notification
      INSERT INTO notifications (user_id, title, message, type)
      VALUES (
        NEW.user_id,
        'Badge Earned',
        'You earned the "Budget Master" badge for creating multiple budgets!',
        'achievement'
      );
    END IF;
  END IF;
  
  -- More badge conditions can be added here
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for badge awards
DROP TRIGGER IF EXISTS award_badges_on_transaction ON transactions;
CREATE TRIGGER award_badges_on_transaction
AFTER INSERT ON transactions
FOR EACH ROW
EXECUTE FUNCTION check_and_award_badges();

-- Function to update challenges progress
CREATE OR REPLACE FUNCTION update_challenge_progress()
RETURNS TRIGGER AS $$
DECLARE
  challenge_record RECORD;
BEGIN
  -- Update relevant challenges for this transaction
  FOR challenge_record IN 
    SELECT id, target_amount, current_amount, category, points_reward
    FROM challenges
    WHERE user_id = NEW.user_id
    AND status = 'active'
    AND category = NEW.category
    AND start_date <= NEW.transaction_date
    AND end_date >= NEW.transaction_date
  LOOP
    -- Update the challenge progress
    UPDATE challenges
    SET current_amount = current_amount + 
      CASE 
        WHEN NEW.type = 'expense' THEN NEW.amount * -1
        ELSE NEW.amount
      END
    WHERE id = challenge_record.id;
    
    -- Check if challenge is completed
    IF (
      (challenge_record.current_amount + 
        CASE 
          WHEN NEW.type = 'expense' THEN NEW.amount * -1
          ELSE NEW.amount
        END
      ) >= challenge_record.target_amount
    ) THEN
      -- Mark challenge as completed
      UPDATE challenges
      SET status = 'completed'
      WHERE id = challenge_record.id;
      
      -- Award points for completing the challenge
      INSERT INTO point_history (user_id, amount, description)
      VALUES (NEW.user_id, challenge_record.points_reward, 'Completed challenge: ' || challenge_record.category);
      
      -- Update user points
      UPDATE user_points
      SET points = points + challenge_record.points_reward,
          level = FLOOR((points + challenge_record.points_reward) / 1000) + 1,
          updated_at = NOW()
      WHERE user_id = NEW.user_id;
      
      -- Create notification
      INSERT INTO notifications (user_id, title, message, type)
      VALUES (
        NEW.user_id,
        'Challenge Completed',
        'Congratulations! You completed the ' || challenge_record.category || ' challenge and earned ' || challenge_record.points_reward || ' points!',
        'achievement'
      );
    END IF;
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updating challenge progress
DROP TRIGGER IF EXISTS update_challenge_on_transaction ON transactions;
CREATE TRIGGER update_challenge_on_transaction
AFTER INSERT ON transactions
FOR EACH ROW
EXECUTE FUNCTION update_challenge_progress();

-- Function to handle new user registration
CREATE OR REPLACE FUNCTION handle_new_user_auth()
RETURNS TRIGGER AS $$
BEGIN
  -- Create a profile record for the new user
  INSERT INTO profiles (id, first_name, last_name, avatar_url, created_at, updated_at)
  VALUES (NEW.id, NULL, NULL, NULL, NOW(), NOW());
  
  -- Initialize user_points for the new user
  INSERT INTO user_points (user_id, points, level, updated_at)
  VALUES (NEW.id, 0, 1, NOW());
  
  -- Create welcome notification
  INSERT INTO notifications (user_id, title, message, type)
  VALUES (
    NEW.id,
    'Welcome to ArthaFlow',
    'Start tracking your finances to achieve financial freedom!',
    'info'
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for new user registration
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION handle_new_user_auth();

-- Function to calculate category expenses
CREATE OR REPLACE FUNCTION get_category_expenses(
  category_name TEXT,
  start_date DATE,
  user_id UUID
) RETURNS DECIMAL AS $$
DECLARE
  total_expenses DECIMAL;
BEGIN
  SELECT COALESCE(SUM(amount), 0)
  INTO total_expenses
  FROM transactions
  WHERE user_id = $3
    AND category = $1
    AND type = 'expense'
    AND DATE_TRUNC('month', transaction_date::date) = DATE_TRUNC('month', $2::date);
  
  RETURN total_expenses;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

