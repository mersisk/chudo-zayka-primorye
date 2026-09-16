CREATE TABLE IF NOT EXISTS applications (
  id uuid PRIMARY KEY,
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'done', 'archived')),
  name varchar(80) NOT NULL,
  phone varchar(18) NOT NULL,
  event_date date NOT NULL,
  city varchar(120),
  child_age varchar(30),
  comment varchar(1000),
  items jsonb NOT NULL,
  known_total integer NOT NULL DEFAULT 0 CHECK (known_total >= 0),
  telegram_status text NOT NULL DEFAULT 'pending' CHECK (telegram_status IN ('pending', 'sent', 'failed')),
  telegram_error varchar(500),
  telegram_sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS applications_created_at_idx ON applications (created_at DESC);
CREATE INDEX IF NOT EXISTS applications_telegram_status_idx ON applications (telegram_status) WHERE telegram_status <> 'sent';
