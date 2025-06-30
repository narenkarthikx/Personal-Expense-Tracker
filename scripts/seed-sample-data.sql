-- Insert sample data for testing
INSERT INTO expenses (amount, category, description, date) VALUES
  (150.00, 'Groceries', 'Weekly grocery shopping', CURRENT_DATE - INTERVAL '1 day'),
  (50.00, 'Petrol', 'Fuel for bike', CURRENT_DATE - INTERVAL '1 day'),
  (200.00, 'Outside Food', 'Dinner at restaurant', CURRENT_DATE - INTERVAL '2 days'),
  (30.00, 'Mobile Recharge', 'Monthly mobile recharge', CURRENT_DATE - INTERVAL '2 days'),
  (80.00, 'Vegetable and Fruits', 'Fresh vegetables and fruits', CURRENT_DATE - INTERVAL '3 days'),
  (25.00, 'Milk and Dairy', 'Milk and yogurt', CURRENT_DATE - INTERVAL '3 days'),
  (120.00, 'Electricity bill', 'Monthly electricity bill', CURRENT_DATE - INTERVAL '4 days'),
  (40.00, 'Snacks and Juice', 'Evening snacks', CURRENT_DATE - INTERVAL '4 days'),
  (300.00, 'Medical', 'Doctor consultation', CURRENT_DATE - INTERVAL '5 days'),
  (60.00, 'Internet', 'Monthly internet bill', CURRENT_DATE - INTERVAL '5 days');
