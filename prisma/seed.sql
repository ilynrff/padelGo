-- Seed Data for Padel Court Booking (Direct SQL for SQLite)

-- Clear existing data
DELETE FROM Booking;
DELETE FROM Court;
DELETE FROM User;

-- Seed Users (ID manual untuk kemudahan relasi, biasanya UUID)
-- Password 'password123' dan 'admin123' (plain text untuk simulasi dev saat ini)
INSERT INTO User (id, name, email, password, role, createdAt)
VALUES 
('u1', 'Budi Santoso', 'budi@padelgo.id', 'password123', 'USER', datetime('now')),
('u2', 'Admin PadelGo', 'admin@padelgo.id', 'admin123', 'ADMIN', datetime('now'));

-- Seed Courts
INSERT INTO Court (id, name, location, price, image, description, isActive, createdAt)
VALUES 
('c1', 'Padel Court A (Premium)', 'Banyumanik, Semarang', 150000, 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?q=80&w=800&auto=format&fit=crop', 'Lapangan indoor premium dengan standar internasional. Pencahayaan anti-silau, lantai turf berkualitas, cocok untuk semua level.', 1, datetime('now')),
('c2', 'Indoor Panoramic Court', 'Tembalang, Semarang', 200000, 'https://images.unsplash.com/photo-1626245917164-21ed202b3145?q=80&w=800&auto=format&fit=crop', 'Satu-satunya lapangan padel dengan pemandangan kota Semarang. Kaca tembus pandang dan ventilasi AC terbaik.', 1, datetime('now')),
('c3', 'Outdoor Classic Court', 'Simpang Lima, Semarang', 120000, 'https://images.unsplash.com/photo-1599423300746-b625333973c4?q=80&w=800&auto=format&fit=crop', 'Lapangan outdoor dengan suasana terbuka. Angin alami dan cahaya siang yang optimal. Harga terjangkau!', 1, datetime('now'));

-- Seed Initial Bookings (Optional)
-- INSERT INTO Booking (id, userId, courtId, date, timeSlot, status, paymentStatus, createdAt)
-- VALUES ('b1', 'u1', 'c1', datetime('2026-04-18'), '10:00-11:00', 'PENDING', 'UNPAID', datetime('now'));
