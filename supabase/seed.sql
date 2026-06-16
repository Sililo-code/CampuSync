-- CampuSync Test Seed Data --
-- Run in Supabase SQL Editor --
-- Safe to re-run (idempotent) --

DO $$
DECLARE
    v_lecturer_id UUID;
    v_student_id UUID;
    v_com301_id UUID;
    v_com302_id UUID;
    v_com303_id UUID;
    v_session_id UUID;
    i INTEGER;
    v_date DATE;
BEGIN
    -- 1. Lookup Test Users
    SELECT id INTO v_lecturer_id FROM public.profiles WHERE email = 'lecturer@cuz.ac.zm';
    SELECT id INTO v_student_id FROM public.profiles WHERE email = 'student@cuz.ac.zm';

    IF v_lecturer_id IS NULL OR v_student_id IS NULL THEN
        RAISE NOTICE 'Test users not found. Ensure lecturer@cuz.ac.zm and student@cuz.ac.zm exist.';
        RETURN;
    END IF;

    -- 2. Create Modules
    INSERT INTO public.modules (code, name, description, lecturer_id, attendance_threshold)
    VALUES 
        ('COM301', 'Software Engineering', 'Advanced principles of software development lifecycle and methodologies.', v_lecturer_id, 80),
        ('COM302', 'Database Systems', 'Relational database design, SQL optimization, and transaction management.', v_lecturer_id, 80),
        ('COM303', 'Computer Networks', 'Architecture, protocols, and security of modern computer networks.', v_lecturer_id, 80)
    ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        description = EXCLUDED.description,
        lecturer_id = EXCLUDED.lecturer_id,
        attendance_threshold = EXCLUDED.attendance_threshold;

    SELECT id INTO v_com301_id FROM public.modules WHERE code = 'COM301';
    SELECT id INTO v_com302_id FROM public.modules WHERE code = 'COM302';
    SELECT id INTO v_com303_id FROM public.modules WHERE code = 'COM303';

    -- 3. Enrol Student
    INSERT INTO public.student_modules (student_id, module_id)
    VALUES 
        (v_student_id, v_com301_id),
        (v_student_id, v_com302_id),
        (v_student_id, v_com303_id)
    ON CONFLICT (student_id, module_id) DO NOTHING;

    -- 4. Create Sessions and Attendance for COM301 (9 Present, 1 Absent)
    FOR i IN 1..10 LOOP
        v_date := CURRENT_DATE - (INTERVAL '1 week' * (10 - i));
        
        INSERT INTO public.sessions (module_id, session_date, session_number, start_time, topic, created_by)
        VALUES (v_com301_id, v_date, i, '09:00:00', 
            CASE i 
                WHEN 1 THEN 'Intro to Software Engineering'
                WHEN 2 THEN 'SDLC Models (Waterfall vs Agile)'
                WHEN 3 THEN 'Agile Methodologies & Scrum'
                WHEN 4 THEN 'Requirements Engineering'
                WHEN 5 THEN 'System Architectural Design'
                WHEN 6 THEN 'UI/UX Design Principles'
                WHEN 7 THEN 'Software Testing & QA'
                WHEN 8 THEN 'Version Control with Git'
                WHEN 9 THEN 'CI/CD and DevOps Pipelines'
                WHEN 10 THEN 'Professional Ethics in SE'
            END, v_lecturer_id)
        ON CONFLICT (module_id, session_date, session_number) DO UPDATE SET topic = EXCLUDED.topic
        RETURNING id INTO v_session_id;

        INSERT INTO public.attendance (session_id, student_id, status, marked_by)
        VALUES (v_session_id, v_student_id, 
            CASE WHEN i = 5 THEN 'absent'::public.attendance_status ELSE 'present'::public.attendance_status END, 
            v_lecturer_id)
        ON CONFLICT (student_id, session_id) DO UPDATE SET status = EXCLUDED.status;
    END LOOP;

    -- 5. Create Sessions and Attendance for COM302 (7 Present, 2 Late, 1 Absent)
    FOR i IN 1..10 LOOP
        v_date := CURRENT_DATE - (INTERVAL '1 week' * (10 - i)) + INTERVAL '1 day'; -- Shift by 1 day for variety
        
        INSERT INTO public.sessions (module_id, session_date, session_number, start_time, topic, created_by)
        VALUES (v_com302_id, v_date, i, '11:00:00', 
            CASE i 
                WHEN 1 THEN 'Database Fundamentals'
                WHEN 2 THEN 'ER Modeling & Relational Algebra'
                WHEN 3 THEN 'Normalization (1NF, 2NF, 3NF, BCNF)'
                WHEN 4 THEN 'SQL Basics (DDL & DML)'
                WHEN 5 THEN 'Advanced SQL & Subqueries'
                WHEN 6 THEN 'Indexing & Query Optimization'
                WHEN 7 THEN 'Transactions & ACID Properties'
                WHEN 8 THEN 'NoSQL Databases Overview'
                WHEN 9 THEN 'Database Security & Concurrency'
                WHEN 10 THEN 'Distributed & Cloud Databases'
            END, v_lecturer_id)
        ON CONFLICT (module_id, session_date, session_number) DO UPDATE SET topic = EXCLUDED.topic
        RETURNING id INTO v_session_id;

        INSERT INTO public.attendance (session_id, student_id, status, marked_by)
        VALUES (v_session_id, v_student_id, 
            CASE 
                WHEN i = 3 THEN 'absent'::public.attendance_status 
                WHEN i IN (6, 8) THEN 'late'::public.attendance_status
                ELSE 'present'::public.attendance_status 
            END, 
            v_lecturer_id)
        ON CONFLICT (student_id, session_id) DO UPDATE SET status = EXCLUDED.status;
    END LOOP;

    -- 6. Create Sessions and Attendance for COM303 (6 Present, 1 Late, 3 Absent)
    FOR i IN 1..10 LOOP
        v_date := CURRENT_DATE - (INTERVAL '1 week' * (10 - i)) + INTERVAL '2 days'; -- Shift by 2 days
        
        INSERT INTO public.sessions (module_id, session_date, session_number, start_time, topic, created_by)
        VALUES (v_com303_id, v_date, i, '14:00:00', 
            CASE i 
                WHEN 1 THEN 'Networking Basics & Network Types'
                WHEN 2 THEN 'The OSI Model Explained'
                WHEN 3 THEN 'TCP/IP Protocol Suite'
                WHEN 4 THEN 'Physical Layer & Transmission'
                WHEN 5 THEN 'Data Link Layer & MAC Addressing'
                WHEN 6 THEN 'Network Layer & IP Addressing'
                WHEN 7 THEN 'Transport Layer (TCP vs UDP)'
                WHEN 8 THEN 'Application Layer Protocols'
                WHEN 9 THEN 'Network Security Fundamentals'
                WHEN 10 THEN 'Wireless & Mobile Networks'
            END, v_lecturer_id)
        ON CONFLICT (module_id, session_date, session_number) DO UPDATE SET topic = EXCLUDED.topic
        RETURNING id INTO v_session_id;

        INSERT INTO public.attendance (session_id, student_id, status, marked_by)
        VALUES (v_session_id, v_student_id, 
            CASE 
                WHEN i IN (2, 4, 7) THEN 'absent'::public.attendance_status 
                WHEN i = 9 THEN 'late'::public.attendance_status
                ELSE 'present'::public.attendance_status 
            END, 
            v_lecturer_id)
        ON CONFLICT (student_id, session_id) DO UPDATE SET status = EXCLUDED.status;
    END LOOP;

END $$;
