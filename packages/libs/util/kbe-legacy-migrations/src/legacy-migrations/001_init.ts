export function up(queryInterface) {
  return queryInterface.sequelize.query(
    `
      CREATE TYPE account_status AS enum(
        'registered', 'emailVerified', 'kycVerified'
      );
      CREATE TABLE public.account (
          id uuid NOT NULL,
          type character varying(255) NOT NULL,
          hin integer NOT NULL,
          status account_status NOT NULL,
          suspended boolean DEFAULT false NOT NULL,
          "createdAt" timestamp with time zone NOT NULL,
          "updatedAt" timestamp with time zone NOT NULL
      );


      ALTER TABLE public.account OWNER TO postgres;

      --
      -- TOC entry 191 (class 1259 OID 16433)
      -- Name: balance; Type: TABLE; Schema: public; Owner: postgres
      --

      CREATE TABLE public.balance (
          id integer NOT NULL,
          value numeric DEFAULT 0,
          "accountId" uuid NOT NULL,
          "currencyId" integer NOT NULL,
          "balanceTypeId" integer NOT NULL,
          "createdAt" timestamp with time zone NOT NULL,
          "updatedAt" timestamp with time zone NOT NULL
      );


      ALTER TABLE public.balance OWNER TO postgres;

      --
      -- TOC entry 201 (class 1259 OID 16533)
      -- Name: cron_schedule; Type: TABLE; Schema: public; Owner: postgres
      --

      CREATE TABLE public.cron_schedule (
          id integer NOT NULL,
          name character varying(255) NOT NULL,
          timezone character varying(255) NOT NULL,
          cron character varying(255) NOT NULL,
          active boolean NOT NULL,
          "createdAt" timestamp with time zone NOT NULL,
          "updatedAt" timestamp with time zone NOT NULL
      );


      ALTER TABLE public.cron_schedule OWNER TO postgres;

      --
      -- TOC entry 200 (class 1259 OID 16531)
      -- Name: cron_schedule_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
      --

      CREATE SEQUENCE public.cron_schedule_id_seq
          START WITH 1
          INCREMENT BY 1
          NO MINVALUE
          NO MAXVALUE
          CACHE 1;


      ALTER TABLE public.cron_schedule_id_seq OWNER TO postgres;

      --
      -- TOC entry 2234 (class 0 OID 0)
      -- Dependencies: 200
      -- Name: cron_schedule_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
      --

      ALTER SEQUENCE public.cron_schedule_id_seq OWNED BY public.cron_schedule.id;


      --
      -- TOC entry 188 (class 1259 OID 16409)
      -- Name: currency; Type: TABLE; Schema: public; Owner: postgres
      --

      CREATE TABLE public.currency (
          id integer NOT NULL,
          currency character varying(255),
          "createdAt" timestamp with time zone NOT NULL,
          "updatedAt" timestamp with time zone NOT NULL
      );


      ALTER TABLE public.currency OWNER TO postgres;

      --
      -- TOC entry 187 (class 1259 OID 16407)
      -- Name: currency_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
      --

      CREATE SEQUENCE public.currency_id_seq
          START WITH 1
          INCREMENT BY 1
          NO MINVALUE
          NO MAXVALUE
          CACHE 1;


      ALTER TABLE public.currency_id_seq OWNER TO postgres;

      --
      -- TOC entry 2235 (class 0 OID 0)
      -- Dependencies: 187
      -- Name: currency_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
      --

      ALTER SEQUENCE public.currency_id_seq OWNED BY public.currency.id;


      --
      -- TOC entry 193 (class 1259 OID 16456)
      -- Name: order; Type: TABLE; Schema: public; Owner: postgres
      --

      CREATE TABLE public."order" (
          id integer NOT NULL,
          "clientOrderId" character varying(255),
          "accountId" uuid,
          direction character varying(255) NOT NULL,
          "symbolId" integer NOT NULL,
          amount numeric(20,8) NOT NULL,
          remaining numeric(20,8) NOT NULL,
          status character varying(255) NOT NULL,
          "orderType" character varying(255) NOT NULL,
          validity character varying(255) NOT NULL,
          "expiryDate" timestamp with time zone,
          "limitPrice" numeric(20,8),
          metadata jsonb,
          "createdAt" timestamp with time zone NOT NULL,
          "updatedAt" timestamp with time zone NOT NULL
      );


      ALTER TABLE public."order" OWNER TO postgres;

      --
      -- TOC entry 196 (class 1259 OID 16502)
      -- Name: order_event; Type: TABLE; Schema: public; Owner: postgres
      --

      CREATE TABLE public.order_event (
          id integer NOT NULL,
          "orderId" integer NOT NULL,
          remaining integer,
          status character varying(255) NOT NULL,
          data text,
          "createdAt" timestamp with time zone NOT NULL
      );


      ALTER TABLE public.order_event OWNER TO postgres;

      --
      -- TOC entry 195 (class 1259 OID 16500)
      -- Name: order_event_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
      --

      CREATE SEQUENCE public.order_event_id_seq
          START WITH 1
          INCREMENT BY 1
          NO MINVALUE
          NO MAXVALUE
          CACHE 1;


      ALTER TABLE public.order_event_id_seq OWNER TO postgres;

      --
      -- TOC entry 2236 (class 0 OID 0)
      -- Dependencies: 195
      -- Name: order_event_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
      --

      ALTER SEQUENCE public.order_event_id_seq OWNED BY public.order_event.id;


      --
      -- TOC entry 192 (class 1259 OID 16454)
      -- Name: order_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
      --

      CREATE SEQUENCE public.order_id_seq
          START WITH 1
          INCREMENT BY 1
          NO MINVALUE
          NO MAXVALUE
          CACHE 1;


      ALTER TABLE public.order_id_seq OWNER TO postgres;

      --
      -- TOC entry 2237 (class 0 OID 0)
      -- Dependencies: 192
      -- Name: order_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
      --

      ALTER SEQUENCE public.order_id_seq OWNED BY public."order".id;


      --
      -- TOC entry 198 (class 1259 OID 16518)
      -- Name: order_queue_status; Type: TABLE; Schema: public; Owner: postgres
      --

      CREATE TABLE public.order_queue_status (
          id integer NOT NULL,
          "symbolId" integer NOT NULL,
          processing boolean DEFAULT false NOT NULL,
          "lastProcessed" timestamp with time zone DEFAULT '2018-05-24 02:12:57.3+00'::timestamp with time zone NOT NULL
      );


      ALTER TABLE public.order_queue_status OWNER TO postgres;

      --
      -- TOC entry 197 (class 1259 OID 16516)
      -- Name: order_queue_status_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
      --

      CREATE SEQUENCE public.order_queue_status_id_seq
          START WITH 1
          INCREMENT BY 1
          NO MINVALUE
          NO MAXVALUE
          CACHE 1;


      ALTER TABLE public.order_queue_status_id_seq OWNER TO postgres;

      --
      -- TOC entry 2238 (class 0 OID 0)
      -- Dependencies: 197
      -- Name: order_queue_status_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
      --

      ALTER SEQUENCE public.order_queue_status_id_seq OWNED BY public.order_queue_status.id;

      --
      -- TOC entry 190 (class 1259 OID 16417)
      -- Name: symbol; Type: TABLE; Schema: public; Owner: postgres
      --

      CREATE TABLE public.symbol (
          id integer NOT NULL,
          "baseId" integer NOT NULL,
          "toId" integer NOT NULL,
          "createdAt" timestamp with time zone NOT NULL,
          "updatedAt" timestamp with time zone NOT NULL
      );


      ALTER TABLE public.symbol OWNER TO postgres;

      --
      -- TOC entry 189 (class 1259 OID 16415)
      -- Name: symbol_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
      --

      CREATE SEQUENCE public.symbol_id_seq
          START WITH 1
          INCREMENT BY 1
          NO MINVALUE
          NO MAXVALUE
          CACHE 1;


      ALTER TABLE public.symbol_id_seq OWNER TO postgres;

      --
      -- TOC entry 2239 (class 0 OID 0)
      -- Dependencies: 189
      -- Name: symbol_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
      --

      ALTER SEQUENCE public.symbol_id_seq OWNED BY public.symbol.id;


      --
      -- TOC entry 194 (class 1259 OID 16475)
      -- Name: trade_transaction; Type: TABLE; Schema: public; Owner: postgres
      --

      CREATE TABLE public.trade_transaction (
          id integer NOT NULL,
          "counterTradeTransactionId" integer NOT NULL,
          direction character varying(255) NOT NULL,
          "symbolId" integer NOT NULL,
          "accountId" uuid NOT NULL,
          "orderId" integer NOT NULL,
          amount numeric(20,8) NOT NULL,
          "matchPrice" numeric(20,8) NOT NULL,
          fee numeric(20,8),
          "feeCurrencyId" integer NOT NULL,
          "createdAt" timestamp with time zone NOT NULL,
          "updatedAt" timestamp with time zone NOT NULL
      );


      ALTER TABLE public.trade_transaction OWNER TO postgres;

      --
      -- TOC entry 186 (class 1259 OID 16391)
      -- Name: user; Type: TABLE; Schema: public; Owner: postgres
      --

      CREATE TABLE public."user" (
          id uuid NOT NULL,
          "accountId" uuid NOT NULL,
          email character varying(255) NOT NULL,
          "passwordHash" character varying(255) NOT NULL,
          activated boolean DEFAULT false NOT NULL,
          "passwordResetKey" character varying(255),
          "mfaTempSecret" character varying(255),
          "mfaSecret" character varying(255),
          "lastLogin" timestamp with time zone,
          "mfaTempSecretCreated" timestamp with time zone,
          "createdAt" timestamp with time zone NOT NULL,
          "updatedAt" timestamp with time zone NOT NULL
      );


      ALTER TABLE public."user" OWNER TO postgres;

      CREATE SEQUENCE public.balance_id_seq
          START WITH 1
          INCREMENT BY 1
          NO MINVALUE
          NO MAXVALUE
          CACHE 1;

      ALTER TABLE public.balance_id_seq OWNER TO postgres;
      ALTER TABLE ONLY public.balance ALTER COLUMN id SET DEFAULT nextval('public.balance_id_seq'::regclass);

      CREATE SEQUENCE public.hin_sequence_seq
          START WITH 100000
          INCREMENT BY 1
          NO MINVALUE
          NO MAXVALUE
          CACHE 1;

      ALTER TABLE public.hin_sequence_seq OWNER TO postgres;
      ALTER TABLE ONLY public.account ALTER COLUMN hin SET DEFAULT nextval('public.hin_sequence_seq'::regclass);

      --
      -- TOC entry 2072 (class 2604 OID 16536)
      -- Name: cron_schedule id; Type: DEFAULT; Schema: public; Owner: postgres
      --

      ALTER TABLE ONLY public.cron_schedule ALTER COLUMN id SET DEFAULT nextval('public.cron_schedule_id_seq'::regclass);


      --
      -- TOC entry 2062 (class 2604 OID 16412)
      -- Name: currency id; Type: DEFAULT; Schema: public; Owner: postgres
      --

      ALTER TABLE ONLY public.currency ALTER COLUMN id SET DEFAULT nextval('public.currency_id_seq'::regclass);


      --
      -- TOC entry 2067 (class 2604 OID 16459)
      -- Name: order id; Type: DEFAULT; Schema: public; Owner: postgres
      --

      ALTER TABLE ONLY public."order" ALTER COLUMN id SET DEFAULT nextval('public.order_id_seq'::regclass);


      --
      -- TOC entry 2068 (class 2604 OID 16505)
      -- Name: order_event id; Type: DEFAULT; Schema: public; Owner: postgres
      --

      ALTER TABLE ONLY public.order_event ALTER COLUMN id SET DEFAULT nextval('public.order_event_id_seq'::regclass);


      --
      -- TOC entry 2069 (class 2604 OID 16521)
      -- Name: order_queue_status id; Type: DEFAULT; Schema: public; Owner: postgres
      --

      ALTER TABLE ONLY public.order_queue_status ALTER COLUMN id SET DEFAULT nextval('public.order_queue_status_id_seq'::regclass);


      --
      -- TOC entry 2063 (class 2604 OID 16420)
      -- Name: symbol id; Type: DEFAULT; Schema: public; Owner: postgres
      --

      ALTER TABLE ONLY public.symbol ALTER COLUMN id SET DEFAULT nextval('public.symbol_id_seq'::regclass);


      --
      -- TOC entry 2074 (class 2606 OID 16390)
      -- Name: account account_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
      --

      ALTER TABLE ONLY public.account
          ADD CONSTRAINT account_pkey PRIMARY KEY (id);


      --
      -- TOC entry 2084 (class 2606 OID 16443)
      -- Name: balance balance_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
      --

      ALTER TABLE ONLY public.balance
          ADD CONSTRAINT balance_pkey PRIMARY KEY (id);


      --
      -- TOC entry 2096 (class 2606 OID 16541)
      -- Name: cron_schedule cron_schedule_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
      --

      ALTER TABLE ONLY public.cron_schedule
          ADD CONSTRAINT cron_schedule_pkey PRIMARY KEY (id);


      --
      -- TOC entry 2080 (class 2606 OID 16414)
      -- Name: currency currency_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
      --

      ALTER TABLE ONLY public.currency
          ADD CONSTRAINT currency_pkey PRIMARY KEY (id);


      --
      -- TOC entry 2090 (class 2606 OID 16510)
      -- Name: order_event order_event_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
      --

      ALTER TABLE ONLY public.order_event
          ADD CONSTRAINT order_event_pkey PRIMARY KEY (id);


      --
      -- TOC entry 2086 (class 2606 OID 16464)
      -- Name: order order_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
      --

      ALTER TABLE ONLY public."order"
          ADD CONSTRAINT order_pkey PRIMARY KEY (id);


      --
      -- TOC entry 2092 (class 2606 OID 16525)
      -- Name: order_queue_status order_queue_status_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
      --

      ALTER TABLE ONLY public.order_queue_status
          ADD CONSTRAINT order_queue_status_pkey PRIMARY KEY (id);


      --
      -- TOC entry 2082 (class 2606 OID 16422)
      -- Name: symbol symbol_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
      --

      ALTER TABLE ONLY public.symbol
          ADD CONSTRAINT symbol_pkey PRIMARY KEY (id);


      --
      -- TOC entry 2088 (class 2606 OID 16479)
      -- Name: trade_transaction trade_transaction_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
      --

      ALTER TABLE ONLY public.trade_transaction
          ADD CONSTRAINT trade_transaction_pkey PRIMARY KEY (id);


      --
      -- TOC entry 2076 (class 2606 OID 16401)
      -- Name: user user_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
      --

      ALTER TABLE ONLY public."user"
          ADD CONSTRAINT user_email_key UNIQUE (email);


      --
      -- TOC entry 2078 (class 2606 OID 16399)
      -- Name: user user_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
      --

      ALTER TABLE ONLY public."user"
          ADD CONSTRAINT user_pkey PRIMARY KEY (id);


      --
      -- TOC entry 2100 (class 2606 OID 16444)
      -- Name: balance balance_accountId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
      --

      ALTER TABLE ONLY public.balance
          ADD CONSTRAINT "balance_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES public.account(id);


      --
      -- TOC entry 2101 (class 2606 OID 16449)
      -- Name: balance balance_currencyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
      --

      ALTER TABLE ONLY public.balance
          ADD CONSTRAINT "balance_currencyId_fkey" FOREIGN KEY ("currencyId") REFERENCES public.currency(id);


      --
      -- TOC entry 2102 (class 2606 OID 16465)
      -- Name: order order_accountId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
      --

      ALTER TABLE ONLY public."order"
          ADD CONSTRAINT "order_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES public.account(id);


      --
      -- TOC entry 2108 (class 2606 OID 16511)
      -- Name: order_event order_event_orderId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
      --

      ALTER TABLE ONLY public.order_event
          ADD CONSTRAINT "order_event_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES public."order"(id) ON UPDATE CASCADE;


      --
      -- TOC entry 2103 (class 2606 OID 16470)
      -- Name: order order_symbolId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
      --

      ALTER TABLE ONLY public."order"
          ADD CONSTRAINT "order_symbolId_fkey" FOREIGN KEY ("symbolId") REFERENCES public.symbol(id);


      --
      -- TOC entry 2098 (class 2606 OID 16423)
      -- Name: symbol symbol_baseId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
      --

      ALTER TABLE ONLY public.symbol
          ADD CONSTRAINT "symbol_baseId_fkey" FOREIGN KEY ("baseId") REFERENCES public.currency(id);


      --
      -- TOC entry 2099 (class 2606 OID 16428)
      -- Name: symbol symbol_toId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
      --

      ALTER TABLE ONLY public.symbol
          ADD CONSTRAINT "symbol_toId_fkey" FOREIGN KEY ("toId") REFERENCES public.currency(id);


      --
      -- TOC entry 2104 (class 2606 OID 16480)
      -- Name: trade_transaction trade_transaction_counterTradeTransactionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
      --

      ALTER TABLE ONLY public.trade_transaction
          ADD CONSTRAINT "trade_transaction_counterTradeTransactionId_fkey"
          FOREIGN KEY ("counterTradeTransactionId") REFERENCES public.trade_transaction(id) ON UPDATE CASCADE DEFERRABLE;


      --
      -- TOC entry 2107 (class 2606 OID 16495)
      -- Name: trade_transaction trade_transaction_feeCurrencyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
      --

      ALTER TABLE ONLY public.trade_transaction
          ADD CONSTRAINT "trade_transaction_feeCurrencyId_fkey" FOREIGN KEY ("feeCurrencyId") REFERENCES public.currency(id);


      --
      -- TOC entry 2106 (class 2606 OID 16490)
      -- Name: trade_transaction trade_transaction_orderId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
      --

      ALTER TABLE ONLY public.trade_transaction
          ADD CONSTRAINT "trade_transaction_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES public."order"(id);


      --
      -- TOC entry 2105 (class 2606 OID 16485)
      -- Name: trade_transaction trade_transaction_symbolId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
      --

      ALTER TABLE ONLY public.trade_transaction
          ADD CONSTRAINT "trade_transaction_symbolId_fkey" FOREIGN KEY ("symbolId") REFERENCES public.symbol(id);


      --
      -- TOC entry 2097 (class 2606 OID 16402)
      -- Name: user user_accountId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
      --

      ALTER TABLE ONLY public."user"
          ADD CONSTRAINT "user_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES public.account(id) ON UPDATE CASCADE ON DELETE CASCADE;
    `,
  )
}

export function down() {
  console.log('No Down Applicable')
}
