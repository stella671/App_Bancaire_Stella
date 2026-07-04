INSERT INTO users (username, password, role) VALUES
  ('stella@superadmin.com', 'admin123', 'admin'),
  ('stella elsa', '&é\"''(', 'user'),
  ('coucou', '&é\"''', 'user'),
  ('testuser', 'test1234', 'user')
ON CONFLICT (username) DO NOTHING;

INSERT INTO banks (name, code, address, country) VALUES
  ('UBA Bank', 'UBA', 'Boulevard de la République', 'CM'),
  ('CCABank', 'CCA', 'Avenue Kennedy', 'CM'),
  ('SGC Afriland', 'SGC', 'Rue du Marché', 'CM'),
  ('Fiertbac', 'FIE', 'Place de l''Indépendance', 'CM'),
  ('ExpressUnion', 'EXU', 'Rue des Banques', 'CM')
ON CONFLICT (code) DO NOTHING;

INSERT INTO accounts (account_number, owner_name, owner_email, account_type, balance, status, bank_id, user_id)
SELECT 'UBA0979939433', 'stella elsa', 'stellasankwe@gmail.com', 'CHECKING', 999501000, 'ACTIVE', 1, 2
WHERE NOT EXISTS (SELECT 1 FROM accounts WHERE account_number = 'UBA0979939433');

INSERT INTO transactions (amount, fee, type, description, source_account_id, destination_account_id, bank_id)
SELECT 1000000000, 0, 'DEPOSIT', 'salaire', null, 1, 1
WHERE NOT EXISTS (SELECT 1 FROM transactions WHERE id = 1);

INSERT INTO transactions (amount, fee, type, description, source_account_id, destination_account_id)
SELECT 500000, 0, 'WITHDRAWAL', 'retrait', 1, null
WHERE NOT EXISTS (SELECT 1 FROM transactions WHERE id = 2);
