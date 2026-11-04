USE bisnis_korea;

CREATE TABLE IF NOT EXISTS pendaftaran (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  nama        VARCHAR(255) NOT NULL,
  whatsapp    VARCHAR(30)  NOT NULL,
  email       VARCHAR(255) NOT NULL,
  provinsi    VARCHAR(100) NOT NULL,
  kabupaten   VARCHAR(100) NOT NULL,
  kecamatan   VARCHAR(100) NOT NULL,
  desa        VARCHAR(100) NOT NULL,
  alamat      TEXT,
  status      VARCHAR(100) NOT NULL,
  ide         VARCHAR(100) NOT NULL,
  cerita      TEXT,
  tujuan      JSON         NOT NULL,
  sumber      VARCHAR(100),
  created_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
