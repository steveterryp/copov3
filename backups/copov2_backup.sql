--
-- PostgreSQL database dump
--

-- Dumped from database version 16.6
-- Dumped by pg_dump version 16.6

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: postgres
--

-- *not* creating schema, since initdb creates it


ALTER SCHEMA public OWNER TO postgres;

--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: postgres
--

COMMENT ON SCHEMA public IS '';


--
-- Name: FeatureRequestImpact; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."FeatureRequestImpact" AS ENUM (
    'LOW',
    'MEDIUM',
    'HIGH',
    'CRITICAL'
);


ALTER TYPE public."FeatureRequestImpact" OWNER TO postgres;

--
-- Name: FeatureRequestStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."FeatureRequestStatus" AS ENUM (
    'PENDING',
    'UNDER_REVIEW',
    'APPROVED',
    'REJECTED',
    'IN_PROGRESS',
    'COMPLETED'
);


ALTER TYPE public."FeatureRequestStatus" OWNER TO postgres;

--
-- Name: POVStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."POVStatus" AS ENUM (
    'DRAFT',
    'IN_PROGRESS',
    'COMPLETED'
);


ALTER TYPE public."POVStatus" OWNER TO postgres;

--
-- Name: PhaseType; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."PhaseType" AS ENUM (
    'PLANNING',
    'EXECUTION',
    'REVIEW'
);


ALTER TYPE public."PhaseType" OWNER TO postgres;

--
-- Name: Priority; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."Priority" AS ENUM (
    'LOW',
    'MEDIUM',
    'HIGH',
    'URGENT'
);


ALTER TYPE public."Priority" OWNER TO postgres;

--
-- Name: SupportRequestPriority; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."SupportRequestPriority" AS ENUM (
    'LOW',
    'MEDIUM',
    'HIGH',
    'URGENT'
);


ALTER TYPE public."SupportRequestPriority" OWNER TO postgres;

--
-- Name: SupportRequestStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."SupportRequestStatus" AS ENUM (
    'OPEN',
    'IN_PROGRESS',
    'RESOLVED',
    'CLOSED'
);


ALTER TYPE public."SupportRequestStatus" OWNER TO postgres;

--
-- Name: TaskPriority; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."TaskPriority" AS ENUM (
    'HIGH',
    'MEDIUM',
    'LOW'
);


ALTER TYPE public."TaskPriority" OWNER TO postgres;

--
-- Name: TaskStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."TaskStatus" AS ENUM (
    'OPEN',
    'IN_PROGRESS',
    'COMPLETED',
    'BLOCKED'
);


ALTER TYPE public."TaskStatus" OWNER TO postgres;

--
-- Name: TeamRole; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."TeamRole" AS ENUM (
    'MEMBER',
    'ADMIN',
    'OWNER'
);


ALTER TYPE public."TeamRole" OWNER TO postgres;

--
-- Name: UserRole; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."UserRole" AS ENUM (
    'USER',
    'ADMIN',
    'SUPER_ADMIN'
);


ALTER TYPE public."UserRole" OWNER TO postgres;

--
-- Name: UserStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."UserStatus" AS ENUM (
    'ACTIVE',
    'INACTIVE',
    'SUSPENDED'
);


ALTER TYPE public."UserStatus" OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: Activity; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Activity" (
    id text NOT NULL,
    "userId" text NOT NULL,
    action text NOT NULL,
    type text NOT NULL,
    metadata jsonb,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."Activity" OWNER TO postgres;

--
-- Name: FeatureRequest; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."FeatureRequest" (
    id text NOT NULL,
    "userId" text NOT NULL,
    category text NOT NULL,
    impact public."FeatureRequestImpact" DEFAULT 'MEDIUM'::public."FeatureRequestImpact" NOT NULL,
    title text NOT NULL,
    description text NOT NULL,
    "businessCase" text NOT NULL,
    "isUrgent" boolean DEFAULT false NOT NULL,
    status public."FeatureRequestStatus" DEFAULT 'PENDING'::public."FeatureRequestStatus" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."FeatureRequest" OWNER TO postgres;

--
-- Name: POV; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."POV" (
    id text NOT NULL,
    title text NOT NULL,
    description text NOT NULL,
    status public."POVStatus" DEFAULT 'DRAFT'::public."POVStatus" NOT NULL,
    priority public."Priority" DEFAULT 'MEDIUM'::public."Priority" NOT NULL,
    "startDate" timestamp(3) without time zone NOT NULL,
    "endDate" timestamp(3) without time zone NOT NULL,
    "ownerId" text NOT NULL,
    "teamId" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    metadata jsonb
);


ALTER TABLE public."POV" OWNER TO postgres;

--
-- Name: Phase; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Phase" (
    id text NOT NULL,
    name text NOT NULL,
    description text NOT NULL,
    type public."PhaseType" DEFAULT 'PLANNING'::public."PhaseType" NOT NULL,
    "startDate" timestamp(3) without time zone NOT NULL,
    "endDate" timestamp(3) without time zone NOT NULL,
    "order" integer NOT NULL,
    "povId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Phase" OWNER TO postgres;

--
-- Name: RefreshToken; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."RefreshToken" (
    id text NOT NULL,
    token text NOT NULL,
    "userId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "expiresAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."RefreshToken" OWNER TO postgres;

--
-- Name: Role; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Role" (
    id text NOT NULL,
    name text NOT NULL,
    permissions text[],
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Role" OWNER TO postgres;

--
-- Name: SupportRequest; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."SupportRequest" (
    id text NOT NULL,
    "userId" text NOT NULL,
    type text NOT NULL,
    priority public."SupportRequestPriority" DEFAULT 'MEDIUM'::public."SupportRequestPriority" NOT NULL,
    subject text NOT NULL,
    description text NOT NULL,
    status public."SupportRequestStatus" DEFAULT 'OPEN'::public."SupportRequestStatus" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."SupportRequest" OWNER TO postgres;

--
-- Name: SystemSettings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."SystemSettings" (
    id text NOT NULL,
    notifications boolean DEFAULT true NOT NULL,
    "twoFactor" boolean DEFAULT false NOT NULL,
    "darkMode" boolean DEFAULT false NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."SystemSettings" OWNER TO postgres;

--
-- Name: Team; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Team" (
    id text NOT NULL,
    name text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Team" OWNER TO postgres;

--
-- Name: TeamMember; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."TeamMember" (
    id text NOT NULL,
    "teamId" text NOT NULL,
    "userId" text NOT NULL,
    role public."TeamRole" DEFAULT 'MEMBER'::public."TeamRole" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."TeamMember" OWNER TO postgres;

--
-- Name: User; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."User" (
    id text NOT NULL,
    name text NOT NULL,
    email text NOT NULL,
    password text NOT NULL,
    role public."UserRole" DEFAULT 'USER'::public."UserRole" NOT NULL,
    status public."UserStatus" DEFAULT 'ACTIVE'::public."UserStatus" NOT NULL,
    "lastLogin" timestamp(3) without time zone,
    "resetTokenHash" text,
    "resetTokenExpiry" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "customRoleId" text
);


ALTER TABLE public."User" OWNER TO postgres;

--
-- Name: UserSettings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."UserSettings" (
    id text NOT NULL,
    "userId" text NOT NULL,
    settings jsonb NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."UserSettings" OWNER TO postgres;

--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


ALTER TABLE public._prisma_migrations OWNER TO postgres;

--
-- Name: attachments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.attachments (
    id text NOT NULL,
    task_id text NOT NULL,
    filename text NOT NULL,
    file_size integer NOT NULL,
    file_type text NOT NULL,
    storage_url text NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.attachments OWNER TO postgres;

--
-- Name: comments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.comments (
    id text NOT NULL,
    task_id text NOT NULL,
    user_id text NOT NULL,
    text text NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.comments OWNER TO postgres;

--
-- Name: notifications; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.notifications (
    id text NOT NULL,
    "userId" text NOT NULL,
    message text NOT NULL,
    type text DEFAULT 'info'::text NOT NULL,
    read boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "actionUrl" text
);


ALTER TABLE public.notifications OWNER TO postgres;

--
-- Name: task_activities; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.task_activities (
    id text NOT NULL,
    task_id text NOT NULL,
    user_id text NOT NULL,
    action text NOT NULL,
    "timestamp" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.task_activities OWNER TO postgres;

--
-- Name: tasks; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tasks (
    id text NOT NULL,
    title text NOT NULL,
    description text,
    assignee_id text,
    team_id text,
    pov_id text,
    phase_id text,
    due_date timestamp(3) without time zone,
    priority public."TaskPriority" DEFAULT 'MEDIUM'::public."TaskPriority" NOT NULL,
    status public."TaskStatus" DEFAULT 'OPEN'::public."TaskStatus" NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.tasks OWNER TO postgres;

--
-- Data for Name: Activity; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Activity" (id, "userId", action, type, metadata, "createdAt") FROM stdin;
cm71navru0003tv50i5js9584	cm71fqhpa00007457be2agum5	GRANTED	PERMISSION_CHECK	{"action": "create", "reason": "CONDITIONS_MET", "success": true, "timestamp": "2025-02-12T08:24:51.545Z", "resourceId": "new", "resourceType": "pov"}	2025-02-12 08:24:51.546
cm71navs30006tv50kewhxyei	cm71fqhpa00007457be2agum5	CREATED	CREATED	{}	2025-02-12 08:24:51.555
cm71oryu00003wa3jooc88ac7	cm71fqhpa00007457be2agum5	GRANTED	PERMISSION_CHECK	{"action": "view", "reason": "CONDITIONS_MET", "success": true, "timestamp": "2025-02-12T09:06:08.279Z", "resourceId": "cm71fqht4000e7457avkspa9o", "resourceType": "pov"}	2025-02-12 09:06:08.281
\.


--
-- Data for Name: FeatureRequest; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."FeatureRequest" (id, "userId", category, impact, title, description, "businessCase", "isUrgent", status, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: POV; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."POV" (id, title, description, status, priority, "startDate", "endDate", "ownerId", "teamId", "createdAt", "updatedAt", metadata) FROM stdin;
cm71navrz0005tv508drm9b2y	AVIS Security Audit	bla	DRAFT	MEDIUM	2025-02-12 00:00:00	2025-03-14 00:00:00	cm71fqhpa00007457be2agum5	\N	2025-02-12 08:24:51.551	2025-02-12 08:24:51.551	{"customer": "AVIS", "teamSize": "1-2", "successCriteria": "bla", "technicalRequirements": "bla"}
cm71fqhsg000c74578yuyug07	EMEA Customer Feedback	Analysis of customer feedback from EMEA region	DRAFT	MEDIUM	2025-02-12 04:53:02.991	2025-02-27 04:53:02.991	cm71fqhqr00017457nljovgpf	cm71fqhs8000374574xekvk2r	2025-02-12 04:53:02.992	2025-02-12 04:53:02.992	\N
cm71fqht4000e7457avkspa9o	EMEA Market Analysis	Comprehensive market analysis for EMEA region	IN_PROGRESS	HIGH	2025-02-12 04:53:02.99	2025-03-14 04:53:02.99	cm71fqhqr00017457nljovgpf	cm71fqhs8000374574xekvk2r	2025-02-12 04:53:02.992	2025-02-12 04:53:02.992	\N
\.


--
-- Data for Name: Phase; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Phase" (id, name, description, type, "startDate", "endDate", "order", "povId", "createdAt", "updatedAt") FROM stdin;
403b5891-f8bd-45cc-84b2-58d8552ebb43	Planning Phase	Initial planning and research	PLANNING	2025-02-12 16:08:35.529	2025-03-14 16:08:35.529	1	cm71fqhsg000c74578yuyug07	2025-02-12 16:08:35.529	2025-02-12 16:08:35.529
a0663db4-aadc-42d7-a95b-a37556225e54	Execution Phase	Implementation and analysis	EXECUTION	2025-02-12 16:08:35.529	2025-03-14 16:08:35.529	1	cm71fqht4000e7457avkspa9o	2025-02-12 16:08:35.529	2025-02-12 16:08:35.529
cm71navs70008tv50habejfp4	Planning	Initial planning phase	PLANNING	2025-02-12 00:00:00	2025-02-19 00:00:00	0	cm71navrz0005tv508drm9b2y	2025-02-12 08:24:51.56	2025-02-12 08:24:51.56
\.


--
-- Data for Name: RefreshToken; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."RefreshToken" (id, token, "userId", "createdAt", "expiresAt") FROM stdin;
cm71gtj2j000bgxxtke8kiwun	eyJhbGciOiJIUzI1NiJ9.eyJ1c2VySWQiOiJjbTcxZnFoczcwMDAyNzQ1N2NuNmZuYWw1IiwiZW1haWwiOiJjaHJpc0BleGFtcGxlLmNvbSIsInJvbGUiOiJVU0VSIiwiZXhwIjoxNzM5OTQyNjA0LCJpYXQiOjE3MzkzMzc4MDR9.M8gmmiQzVuiJK7u1M1FR454s_0LGjBpv-1zwWxeP5nI	cm71fqhs700027457cn6fnal5	2025-02-12 05:23:24.236	2025-02-19 05:23:24.235
cm71n8vw00001tv50ivy5sh96	eyJhbGciOiJIUzI1NiJ9.eyJ1c2VySWQiOiJjbTcxZnFocGEwMDAwNzQ1N2JlMmFndW01IiwiZW1haWwiOiJhZG1pbkBleGFtcGxlLmNvbSIsInJvbGUiOiJBRE1JTiIsImV4cCI6MTczOTk1MzM5OCwiaWF0IjoxNzM5MzQ4NTk4fQ.l3KVi8IFCYoxHwwBLpeKeO1S5xA5jec2aOotcpzR7aI	cm71fqhpa00007457be2agum5	2025-02-12 08:23:18.384	2025-02-19 08:23:18.382
cm71orlzi0001wa3jrt72xrhe	eyJhbGciOiJIUzI1NiJ9.eyJ1c2VySWQiOiJjbTcxZnFocGEwMDAwNzQ1N2JlMmFndW01IiwiZW1haWwiOiJhZG1pbkBleGFtcGxlLmNvbSIsInJvbGUiOiJBRE1JTiIsImV4cCI6MTczOTk1NTk1MSwiaWF0IjoxNzM5MzUxMTUxfQ.v4gM7lgMzGhM56uXC9qprlyRJoPFgc-VO7dwPzHxBow	cm71fqhpa00007457be2agum5	2025-02-12 09:05:51.63	2025-02-19 09:05:51.629
\.


--
-- Data for Name: Role; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Role" (id, name, permissions, "createdAt", "updatedAt") FROM stdin;
cm71axqtv0002wpnqrracrvtb	Sales Engineer	{}	2025-02-12 02:38:43.22	2025-02-12 02:55:22.924
cm71bcw8i0003wpnq2trbngcs	Technical Lead	{}	2025-02-12 02:50:30.066	2025-02-12 02:55:35.905
cm71bjnze0006wpnqt3fijom6	Project Manager	{}	2025-02-12 02:55:45.963	2025-02-12 02:55:45.963
cm71clhup0002ruftr5yqvpjk	PS Engineer	{}	2025-02-12 03:25:10.945	2025-02-12 03:25:10.945
\.


--
-- Data for Name: SupportRequest; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."SupportRequest" (id, "userId", type, priority, subject, description, status, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: SystemSettings; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."SystemSettings" (id, notifications, "twoFactor", "darkMode", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Team; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Team" (id, name, "createdAt", "updatedAt") FROM stdin;
cm71fqhs8000374574xekvk2r	EMEA	2025-02-12 04:53:02.985	2025-02-12 04:53:02.985
cm71fqhsd00077457yxcpvjiu	APAC	2025-02-12 04:53:02.99	2025-02-12 04:53:02.99
\.


--
-- Data for Name: TeamMember; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."TeamMember" (id, "teamId", "userId", role, "createdAt", "updatedAt") FROM stdin;
cm71fqhs800057457a1fct81o	cm71fqhs8000374574xekvk2r	cm71fqhqr00017457nljovgpf	OWNER	2025-02-12 04:53:02.985	2025-02-12 04:53:02.985
cm71fqhs8000674575mf3yqtm	cm71fqhs8000374574xekvk2r	cm71fqhs700027457cn6fnal5	MEMBER	2025-02-12 04:53:02.985	2025-02-12 04:53:02.985
cm71fqhse00097457k749g7w5	cm71fqhsd00077457yxcpvjiu	cm71fqhs700027457cn6fnal5	OWNER	2025-02-12 04:53:02.99	2025-02-12 04:53:02.99
cm71fqhse000a745710aa78b8	cm71fqhsd00077457yxcpvjiu	cm71fqhqr00017457nljovgpf	MEMBER	2025-02-12 04:53:02.99	2025-02-12 04:53:02.99
\.


--
-- Data for Name: User; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."User" (id, name, email, password, role, status, "lastLogin", "resetTokenHash", "resetTokenExpiry", "createdAt", "updatedAt", "customRoleId") FROM stdin;
cm71fqhpa00007457be2agum5	Admin User	admin@example.com	$2a$10$0iYbaE/tQdU3qtxX1xAn3.2JIKtNlxiorFp3R.gSsZEGebLjp9tOC	ADMIN	ACTIVE	\N	\N	\N	2025-02-12 04:53:02.878	2025-02-12 04:53:02.878	\N
cm71fqhqr00017457nljovgpf	Rika Terry	rika@example.com	$2a$10$2fJJYPIkj3bfEE5DUPS.A.hVy1K2W4vOF3bc.j1rZVpvLPKkG4r62	USER	ACTIVE	\N	\N	\N	2025-02-12 04:53:02.931	2025-02-12 04:53:02.931	\N
cm71fqhs700027457cn6fnal5	Chris Terry	chris@example.com	$2a$10$R3h7XAq3GRvbHQR9niwTwunE4olhNO53zsZb.NjE2Yk2XlzEUZ9G6	USER	ACTIVE	\N	\N	\N	2025-02-12 04:53:02.983	2025-02-12 04:53:02.983	\N
\.


--
-- Data for Name: UserSettings; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."UserSettings" (id, "userId", settings, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
71a56cdf-6d9a-4e4f-85eb-4bdd4c1e9e48	1adf89b6e84e99163fefcd034634a70e943eaae467f355670dd158a4705bef84	2025-02-09 18:48:52.473769+11	20250209074117_init	\N	\N	2025-02-09 18:48:52.424285+11	1
708405eb-1388-4577-b83e-36413f31f548	2bdde7ab2696a35c074eabc56194797f95637a964d822c61894f71c14ed68e2c	2025-02-09 19:48:50.54974+11	20250209084850_add_pov_metadata	\N	\N	2025-02-09 19:48:50.547508+11	1
7310d23b-eeb8-4a8a-9e23-deba4df22eef	015a38af6f5e5dbb86dc614429a2ecd31e57b07362f7195df2f8aa0b2224dc6c	2025-02-11 13:45:00.124518+11	20250211024500_add_title_to_notifications	\N	\N	2025-02-11 13:45:00.121752+11	1
d1b55d73-c7ef-46db-9635-a0df201ea395	cabcf31e0248d11fb4d2321267daf0f342dfc68e1da94c5a5bff61d06246bde0	2025-02-11 13:49:24.102206+11	20250211024924_update_notification_schema	\N	\N	2025-02-11 13:49:24.089742+11	1
1714c3e0-b295-4b15-83ce-b4954de8c4ac	92ff7f07899afd625a3a1a57eccc0109638656b01f264c5b5ca1db9302d5dd81	2025-02-11 13:51:14.859757+11	20250211025114_add_notification_index	\N	\N	2025-02-11 13:51:14.856334+11	1
e84b4bdf-8870-40b7-9f10-80b8de6d736f	14845a4e103add7bf149bb3e52e39dd80836cb326f2d0f1d7715c9917f83d59f	2025-02-11 13:53:25.998671+11	20250211025325_update_notification_fields	\N	\N	2025-02-11 13:53:25.996412+11	1
\.


--
-- Data for Name: attachments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.attachments (id, task_id, filename, file_size, file_type, storage_url, created_at) FROM stdin;
\.


--
-- Data for Name: comments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.comments (id, task_id, user_id, text, created_at) FROM stdin;
\.


--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.notifications (id, "userId", message, type, read, "createdAt", "actionUrl") FROM stdin;
\.


--
-- Data for Name: task_activities; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.task_activities (id, task_id, user_id, action, "timestamp") FROM stdin;
\.


--
-- Data for Name: tasks; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.tasks (id, title, description, assignee_id, team_id, pov_id, phase_id, due_date, priority, status, created_at, updated_at) FROM stdin;
ae87d430-7c7b-4e72-a368-f4d50294c1ed	Research Market Trends	Analyze current market trends and patterns	cm71fqhqr00017457nljovgpf	\N	cm71fqhsg000c74578yuyug07	403b5891-f8bd-45cc-84b2-58d8552ebb43	\N	HIGH	COMPLETED	2025-02-12 16:11:07.113	2025-02-12 16:11:07.113
875b24f4-787d-482e-af61-7f6a50587365	Gather Customer Data	Collect and organize customer feedback data	cm71fqhs700027457cn6fnal5	\N	cm71fqhsg000c74578yuyug07	403b5891-f8bd-45cc-84b2-58d8552ebb43	\N	MEDIUM	IN_PROGRESS	2025-02-12 16:11:21.052	2025-02-12 16:11:21.052
ad50d4f1-be71-4952-954e-28c1c66bcb27	Implement Strategy	Execute market analysis plan	cm71fqhqr00017457nljovgpf	\N	cm71fqht4000e7457avkspa9o	a0663db4-aadc-42d7-a95b-a37556225e54	\N	HIGH	IN_PROGRESS	2025-02-12 16:11:30.84	2025-02-12 16:11:30.84
b47bc7f7-7e4f-43e3-bffe-cfc60b7db3f8	Analyze Results	Review and analyze implementation results	cm71fqhs700027457cn6fnal5	\N	cm71fqht4000e7457avkspa9o	a0663db4-aadc-42d7-a95b-a37556225e54	\N	MEDIUM	OPEN	2025-02-12 16:11:40.743	2025-02-12 16:11:40.743
aa04b598-df4d-4538-98d1-0565df8aaadf	Analyze Results	Review and analyze implementation results	cm71fqhs700027457cn6fnal5	\N	cm71fqht4000e7457avkspa9o	a0663db4-aadc-42d7-a95b-a37556225e54	\N	MEDIUM	OPEN	2025-02-12 16:17:18.182	2025-02-12 16:17:18.182
\.


--
-- Name: Activity Activity_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Activity"
    ADD CONSTRAINT "Activity_pkey" PRIMARY KEY (id);


--
-- Name: FeatureRequest FeatureRequest_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."FeatureRequest"
    ADD CONSTRAINT "FeatureRequest_pkey" PRIMARY KEY (id);


--
-- Name: POV POV_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."POV"
    ADD CONSTRAINT "POV_pkey" PRIMARY KEY (id);


--
-- Name: Phase Phase_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Phase"
    ADD CONSTRAINT "Phase_pkey" PRIMARY KEY (id);


--
-- Name: RefreshToken RefreshToken_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."RefreshToken"
    ADD CONSTRAINT "RefreshToken_pkey" PRIMARY KEY (id);


--
-- Name: Role Role_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Role"
    ADD CONSTRAINT "Role_pkey" PRIMARY KEY (id);


--
-- Name: SupportRequest SupportRequest_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."SupportRequest"
    ADD CONSTRAINT "SupportRequest_pkey" PRIMARY KEY (id);


--
-- Name: SystemSettings SystemSettings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."SystemSettings"
    ADD CONSTRAINT "SystemSettings_pkey" PRIMARY KEY (id);


--
-- Name: TeamMember TeamMember_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."TeamMember"
    ADD CONSTRAINT "TeamMember_pkey" PRIMARY KEY (id);


--
-- Name: Team Team_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Team"
    ADD CONSTRAINT "Team_pkey" PRIMARY KEY (id);


--
-- Name: UserSettings UserSettings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."UserSettings"
    ADD CONSTRAINT "UserSettings_pkey" PRIMARY KEY (id);


--
-- Name: User User_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_pkey" PRIMARY KEY (id);


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: attachments attachments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.attachments
    ADD CONSTRAINT attachments_pkey PRIMARY KEY (id);


--
-- Name: comments comments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.comments
    ADD CONSTRAINT comments_pkey PRIMARY KEY (id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: task_activities task_activities_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.task_activities
    ADD CONSTRAINT task_activities_pkey PRIMARY KEY (id);


--
-- Name: tasks tasks_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_pkey PRIMARY KEY (id);


--
-- Name: RefreshToken_token_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "RefreshToken_token_key" ON public."RefreshToken" USING btree (token);


--
-- Name: Role_name_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Role_name_key" ON public."Role" USING btree (name);


--
-- Name: TeamMember_teamId_userId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "TeamMember_teamId_userId_key" ON public."TeamMember" USING btree ("teamId", "userId");


--
-- Name: UserSettings_userId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "UserSettings_userId_key" ON public."UserSettings" USING btree ("userId");


--
-- Name: User_email_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "User_email_key" ON public."User" USING btree (email);


--
-- Name: notifications_userId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "notifications_userId_idx" ON public.notifications USING btree ("userId");


--
-- Name: Activity Activity_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Activity"
    ADD CONSTRAINT "Activity_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: FeatureRequest FeatureRequest_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."FeatureRequest"
    ADD CONSTRAINT "FeatureRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: POV POV_ownerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."POV"
    ADD CONSTRAINT "POV_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: POV POV_teamId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."POV"
    ADD CONSTRAINT "POV_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES public."Team"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Phase Phase_povId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Phase"
    ADD CONSTRAINT "Phase_povId_fkey" FOREIGN KEY ("povId") REFERENCES public."POV"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: RefreshToken RefreshToken_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."RefreshToken"
    ADD CONSTRAINT "RefreshToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: SupportRequest SupportRequest_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."SupportRequest"
    ADD CONSTRAINT "SupportRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: TeamMember TeamMember_teamId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."TeamMember"
    ADD CONSTRAINT "TeamMember_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES public."Team"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: TeamMember TeamMember_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."TeamMember"
    ADD CONSTRAINT "TeamMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: UserSettings UserSettings_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."UserSettings"
    ADD CONSTRAINT "UserSettings_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: User User_customRoleId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_customRoleId_fkey" FOREIGN KEY ("customRoleId") REFERENCES public."Role"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: attachments attachments_task_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.attachments
    ADD CONSTRAINT attachments_task_id_fkey FOREIGN KEY (task_id) REFERENCES public.tasks(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: comments comments_task_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.comments
    ADD CONSTRAINT comments_task_id_fkey FOREIGN KEY (task_id) REFERENCES public.tasks(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: comments comments_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.comments
    ADD CONSTRAINT comments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: notifications notifications_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: task_activities task_activities_task_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.task_activities
    ADD CONSTRAINT task_activities_task_id_fkey FOREIGN KEY (task_id) REFERENCES public.tasks(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: task_activities task_activities_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.task_activities
    ADD CONSTRAINT task_activities_user_id_fkey FOREIGN KEY (user_id) REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: tasks tasks_assignee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_assignee_id_fkey FOREIGN KEY (assignee_id) REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: tasks tasks_phase_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_phase_id_fkey FOREIGN KEY (phase_id) REFERENCES public."Phase"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: tasks tasks_pov_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_pov_id_fkey FOREIGN KEY (pov_id) REFERENCES public."POV"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: tasks tasks_team_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_team_id_fkey FOREIGN KEY (team_id) REFERENCES public."Team"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: postgres
--

REVOKE USAGE ON SCHEMA public FROM PUBLIC;


--
-- PostgreSQL database dump complete
--

