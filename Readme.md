<h1>1. Normalisasi Database</h1>
<h3>Penjelasan singkat mengenai normalisasi</h3>
     Menurut saya normalisasi merupakan proses untuk merapikan stuktur table ager data tidak berulang serta meminimalkan keanehan dan memastikan setiap data tersimpan pada tempat yang sesuai. Tahap ini melewati beberapa bentuk 1NF,2NF, dan 3NF dan hasil akhirnya berupa table yang lebih terstruktur, relasi jelas dan data lebih terjaga.

<h3>Contoh tabel sebelum normalisasi</h3>
    Struktur awal satu table besar
    CREATE TABLE sebelum_normalisasi (
    id                      UUID DEFAULT gen_random_uuid(),

    user_id                 UUID,
    username                TEXT,
    email                   TEXT,
    password_hash           TEXT,
    role                    TEXT,

    project_id              UUID,
    project_name            TEXT,
    project_description     TEXT,
    project_manager_id      UUID,
    project_manager_name    TEXT,

    project_member_ids      TEXT,     
    project_member_names    TEXT,

    task_id                 UUID,
    task_title              TEXT,
    task_description        TEXT,
    task_status             TEXT,
    assignee_id             UUID,
    assignee_name           TEXT,
    due_date                DATE,

    comment_ids             TEXT,     
    comment_user_ids        TEXT,
    comment_contents        TEXT,    

    attachment_ids          TEXT,
    attachment_paths        TEXT,
    attachment_names        TEXT,
    attachment_sizes        TEXT,
    attachment_types        TEXT,

    notification_ids        TEXT,
    notification_messages   TEXT,
    notification_statuses   TEXT,

    created_at              TIMESTAMP,
    updated_at              TIMESTAMP
);

seperti ini contohnya yang di jadiin 1 table besar


<h3>Contoh tabel setelah dinormalisasi sampai 3NF (beserta penjelasan singkat)</h3>

1. Tabel Users

Menyimpan informasi pengguna tanpa duplikasi.
id	username	email	role

2. Tabel Projects
Satu proyek memiliki satu manager.
id	nama	deskripsi	manager_id

3. Tabel Project Members (Many-to-Many)
Menghubungkan pengguna dan proyek.
project_id	user_id

4. Tabel Tasks
Satu tugas terkait proyek dan bisa memiliki satu assignee.
id	project_id	title	status	assignee_id

5. Tabel Comments
Komentar terkait tugas dan user.
id	task_id	user_id	content

6. Tabel Attachments
Setiap lampiran terkait tugas tertentu.
id	task_id	file_path	file_name	file_size


1NF: Semua kolom memiliki nilai atomic (tidak ada lagi list yang digabung dalam satu kolom).

2NF: Semua kolom non-key bergantung sepenuhnya pada primary key masing-masing tabel.

3NF: Tidak ada kolom yang bergantung secara transitif pada non-key (misalnya nama manager tidak disimpan lagi, hanya manager_id).


<h1>2.  Backend (Ekosistem JavaScript)</h1>

<h3>3.	Dokumentasi Backend di README</h3>
    Untuk menjalankan backend diwajibkan untuk membuat database yang sesuai di .env di backend dengan menggunakan PostgreSQL, setelah membuat database dapat langsung menjalankan backend golangnya dngan membuka terminal di folder backend setelah itu ketik

    go run main.go

    sebelum itu diwajibkan untuk mendownload golang terlebih dahulu

    https://go.dev/dl/

    untuk menganti JWT_SECRET bisa diganti di .env tetapi agar lebih aman lagi lebih baik di ganti juga di module/auth/util/jwt


    untuk file sql nya sudah saya sertakan di folder database


<h1>3. Frontend (Ekosistem JavaScript)</h1>

<h3>4.	Dokumentasi Frontend di README</h3>

langsung install depedency npm install juga npx install, bisa juga npm install --fix juga npx install --fix

cara menjalankannya npx expo start --clear  

base urlnya frontend http://localhost:8081/

base url backend http://localhost:8080/api

ini url apk mobilenya yang belum saya sertakan update terbarunya https://expo.dev/accounts/mffathir/projects/taskmanagementapp/builds/17787899-83af-41cf-afd7-2c8df7c40eb5
