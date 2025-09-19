-- Function to delete all user data
CREATE OR REPLACE FUNCTION delete_user_data(user_id_input UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Delete budgets
  DELETE FROM budgets WHERE user_id = user_id_input;
  
  -- Delete expenses
  DELETE FROM expenses WHERE user_id = user_id_input;
  
  -- Delete categories
  DELETE FROM categories WHERE user_id = user_id_input;
  
  -- You could add other tables here if needed in the future
END;
$$;
