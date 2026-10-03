import { useEffect, useRef, useState } from "react"
import {
  type AISettings,
  type AuthUser,
  getAISettings,
  getCashOutSpeech,
  getMe,
  getPublicConfig,
  hasStoredToken,
  login as apiLogin,
  logout as apiLogout,
  quickLogin,
  saveAISettings,
  sendAgentMessage,
  testAIConnection,
  testTTSConnection,
  generateGeneralTTS,
  getContacts,
  getTransactions,
  addContact,
  addTransaction,
  type ContactItem,
  type TransactionItem,
} from "./api"

type Page =
  | "home" | "account" | "history" | "more" | "splash" | "login" | "admin"
  | "cashout" | "send-money" | "recharge" | "pay-bill" | "add-money" | "savings"
  | "fund-transfer" | "request-money" | "make-payment" | "refer-earn" | "npsb"
  | "add-contact"
type Language = "en" | "bn"
type VoiceStep =
  | "welcome"
  | "confirm-intent"
  | "recipient"
  | "confirm-recipient"
  | "amount"
  | "confirm-amount"
  | "review"
  | "complete"
  | "help"
type VoiceAgentPage = "home" | "cashout" | "send" | "recharge" | "balance"

const photo =
  "https://images.unsplash.com/photo-1781271780548-49339c20eb60?auto=format&fit=crop&w=160&h=160&q=80"

function Icon({
  name,
  size = 24,
  strokeWidth = 1.8,
}: {
  name: string
  size?: number
  strokeWidth?: number
}) {
  const paths: Record<string, React.ReactNode> = {
    home: (
      <>
        <path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z" />
        <path d="M9 21v-7h6v7" />
      </>
    ),
    user: (
      <>
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21a8 8 0 0 1 16 0" />
      </>
    ),
    history: (
      <>
        <path d="M3 12a9 9 0 1 0 2.7-6.4L3 8" />
        <path d="M3 3v5h5M12 7v5l3 2" />
      </>
    ),
    more: (
      <>
        <circle cx="5" cy="5" r="1" />
        <circle cx="12" cy="5" r="1" />
        <circle cx="19" cy="5" r="1" />
        <circle cx="5" cy="12" r="1" />
        <circle cx="12" cy="12" r="1" />
        <circle cx="19" cy="12" r="1" />
        <circle cx="5" cy="19" r="1" />
        <circle cx="12" cy="19" r="1" />
        <circle cx="19" cy="19" r="1" />
      </>
    ),
    scan: (
      <>
        <path d="M4 9V5a1 1 0 0 1 1-1h4m6 0h4a1 1 0 0 1 1 1v4M4 15v4a1 1 0 0 0 1 1h4m6 0h4a1 1 0 0 0 1-1v-4M4 12h16" />
        <rect x="9" y="9" width="6" height="6" rx="1" />
      </>
    ),
    bell: (
      <>
        <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" />
      </>
    ),
    arrow: (
      <>
        <path d="M5 12h14m-6-6 6 6-6 6" />
      </>
    ),
    left: <path d="m15 18-6-6 6-6" />,
    chevron: <path d="m9 18 6-6-6-6" />,
    down: <path d="m6 9 6 6 6-6" />,
    eye: (
      <>
        <path d="M2 12s3.6-6 10-6 10 6 10 6-3.6 6-10 6S2 12 2 12Z" />
        <circle cx="12" cy="12" r="2.5" />
      </>
    ),
    eyeoff: (
      <>
        <path d="M3 3 21 21M10.6 6.1A12 12 0 0 1 12 6c6.4 0 10 6 10 6a15 15 0 0 1-3.3 3.6M6.5 6.5C3.5 8.2 2 12 2 12s3.6 6 10 6a10 10 0 0 0 4.1-.9" />
      </>
    ),
    send: (
      <>
        <path d="M21 3 3 10l7 3 3 8 8-18Z" />
        <path d="m10 13 11-10" />
      </>
    ),
    phone: (
      <>
        <rect x="7" y="2" width="10" height="20" rx="2" />
        <path d="M11 18h2" />
      </>
    ),
    cash: (
      <>
        <rect x="2" y="5" width="20" height="14" rx="2" />
        <circle cx="12" cy="12" r="3" />
        <path d="M5 9h1m12 6h1" />
      </>
    ),
    receipt: (
      <>
        <path d="M5 3h14v18l-3-2-4 2-4-2-3 2V3Z" />
        <path d="M9 8h6m-6 4h6" />
      </>
    ),
    plus: <path d="M12 5v14M5 12h14" />,
    savings: (
      <>
        <path d="M4 9c1-2 4-4 8-4s7 2 8 5v7H4V9ZM7 17v3m10-3v3M10 9h4M20 11h2" />
        <circle cx="7" cy="11" r=".6" fill="currentColor" stroke="none" />
      </>
    ),
    transfer: (
      <>
        <path d="M4 7h16m-4-4 4 4-4 4M20 17H4m4-4-4 4 4 4" />
      </>
    ),
    request: (
      <>
        <circle cx="9" cy="8" r="3" />
        <path d="M3 19a6 6 0 0 1 10-4m5-5v9m-4-4h8" />
      </>
    ),
    bag: (
      <>
        <path d="M4 8h16l-1 13H5L4 8ZM9 9V6a3 3 0 0 1 6 0v3" />
      </>
    ),
    gift: (
      <>
        <rect x="3" y="9" width="18" height="12" rx="1" />
        <path d="M12 9v12M2 9h20M12 9C8 9 6 7 6 5a2 2 0 0 1 4 0c0 2 2 4 2 4Zm0 0c4 0 6-2 6-4a2 2 0 0 0-4 0c0 2-2 4-2 4Z" />
      </>
    ),
    bank: (
      <>
        <path d="m2 9 10-6 10 6H2Zm2 11h16M6 10v9m4-9v9m4-9v9m4-9v9" />
      </>
    ),
    car: (
      <>
        <path d="m5 10 2-5h10l2 5M4 17h16v-6H4v6Zm2 0v2m12-2v2M7 14h1m8 0h1" />
      </>
    ),
    road: (
      <>
        <path d="M7 3h10l4 18H3L7 3Zm5 1v3m0 4v3m0 4v2" />
      </>
    ),
    education: (
      <>
        <path d="m2 9 10-5 10 5-10 5L2 9Zm4 3v5c3 3 9 3 12 0v-5M22 9v7" />
      </>
    ),
    heart: (
      <path d="M20.8 8.6c0 4.2-8.8 10.3-8.8 10.3S3.2 12.8 3.2 8.6a4.5 4.5 0 0 1 8.8-1.2 4.5 4.5 0 0 1 8.8 1.2Z" />
    ),
    shield: (
      <>
        <path d="m12 2 8 4v6c0 5-3.5 8-8 10-4.5-2-8-5-8-10V6l8-4Z" />
        <path d="m9 12 2 2 4-4" />
      </>
    ),
    donate: (
      <>
        <path d="M12 21s-9-5-9-11a4 4 0 0 1 8-1 4 4 0 0 1 8 1c0 6-7 11-7 11Z" />
        <path d="M12 13v5m-2.5-2.5h5" />
      </>
    ),
    moon: (
      <>
        <path d="M20 15.5A8 8 0 0 1 8.5 4 8 8 0 1 0 20 15.5Z" />
        <path d="m17 3 .5 1.5L19 5l-1.5.5L17 7l-.5-1.5L15 5l1.5-.5L17 3Z" />
      </>
    ),
    ticket: (
      <>
        <path d="M3 7h18v4a2 2 0 0 0 0 4v3H3v-3a2 2 0 0 0 0-4V7Zm9 0v2m0 2v2m0 2v3" />
      </>
    ),
    hotel: (
      <>
        <path d="M4 21V5h11v16M15 11h5v10M2 21h20M8 9h3m-3 4h3m-3 4h3" />
      </>
    ),
    train: (
      <>
        <rect x="5" y="3" width="14" height="16" rx="3" />
        <path d="M5 12h14M8 22l2-3m6 0 2 3M9 7h6m-6 9h1m4 0h1" />
      </>
    ),
    music: (
      <>
        <path d="M9 18V5l11-2v13M9 8l11-2" />
        <circle cx="6" cy="18" r="3" />
        <circle cx="17" cy="16" r="3" />
      </>
    ),
    book: (
      <>
        <path d="M12 6c-3-2-6-2-9-1v14c3-1 6-1 9 1 3-2 6-2 9-1V5c-3-1-6-1-9 1Zm0 0v14" />
      </>
    ),
    game: (
      <>
        <path d="M6 8h12a4 4 0 0 1 4 4l-1 6a2 2 0 0 1-3 1l-4-3h-4l-4 3a2 2 0 0 1-3-1l-1-6a4 4 0 0 1 4-4Zm1 4v4m-2-2h4m7-1h.1m2 2h.1" />
      </>
    ),
    wheel: (
      <>
        <circle cx="12" cy="12" r="9" />
        <circle cx="12" cy="12" r="2" />
        <path d="M12 3v7m0 4v7m9-9h-7m-4 0H3m2.6-6.4 5 5m2.8 2.8 5 5m0-12.8-5 5m-2.8 2.8-5 5" />
      </>
    ),
    card: (
      <>
        <rect x="2" y="5" width="20" height="14" rx="2" />
        <path d="M2 10h20m-16 5h4" />
      </>
    ),
    tag: (
      <>
        <path d="M3 12V4h8l10 10-7 7L3 12Z" />
        <circle cx="7.5" cy="8" r="1" />
      </>
    ),
    fingerprint: (
      <>
        <path d="M4 11a8 8 0 0 1 16 0M7 11a5 5 0 0 1 10 0M12 9a2 2 0 0 1 2 2c0 4-.3 7-2 10M10 12c0 4-.5 6-2 8m8-6c-.1 2-.5 4-1 6M4 14c0 2-.3 3.5-1 5m16-5c0 2 .5 4 1 5" />
      </>
    ),
    lock: (
      <>
        <rect x="5" y="10" width="14" height="11" rx="2" />
        <path d="M8 10V7a4 4 0 0 1 8 0v3m-4 4v3" />
      </>
    ),
    globe: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M3 12h18M12 3c-5 5-5 13 0 18m0-18c5 5 5 13 0 18" />
      </>
    ),
    sliders: (
      <>
        <path d="M4 6h16M4 12h16M4 18h16" />
        <circle cx="9" cy="6" r="2" fill="white" />
        <circle cx="16" cy="12" r="2" fill="white" />
        <circle cx="8" cy="18" r="2" fill="white" />
      </>
    ),
    headset: (
      <>
        <path d="M4 14v-3a8 8 0 0 1 16 0v3M4 14h3v5H5a2 2 0 0 1-2-2v-1a2 2 0 0 1 1-2Zm16 0h-3v5h2a2 2 0 0 0 2-2v-1a2 2 0 0 0-1-2ZM17 19c0 2-2 3-5 3" />
      </>
    ),
    help: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M9.5 9a2.5 2.5 0 1 1 4.3 1.7C12.5 12 12 12.5 12 14m0 3h.01" />
      </>
    ),
    edit: (
      <>
        <path d="m4 16 10-10 4 4L8 20H4v-4Zm9-9 3-3a2 2 0 0 1 3 0l1 1a2 2 0 0 1 0 3l-3 3" />
      </>
    ),
    file: (
      <>
        <path d="M6 2h9l4 4v16H6V2Zm9 0v5h4M9 12h7m-7 4h7" />
      </>
    ),
    logout: (
      <>
        <path d="M10 4H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h5m4-4 4-4-4-4m4 4H9" />
      </>
    ),
    check: <path d="m5 12 5 5L20 7" />,
    close: <path d="M5 5 19 19M19 5 5 19" />,
    backspace: (
      <>
        <path d="M9 4H21v16H9L2 12l7-8Z" />
        <path d="m13 9 5 6m0-6-5 6" />
      </>
    ),
    calendar: (
      <>
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M7 3v4m10-4v4M3 10h18" />
      </>
    ),
    spark: (
      <>
        <path d="m12 2 2.2 7.8L22 12l-7.8 2.2L12 22l-2.2-7.8L2 12l7.8-2.2L12 2Z" />
      </>
    ),
    mic: (
      <>
        <rect x="9" y="2" width="6" height="12" rx="3" />
        <path d="M5 10a7 7 0 0 0 14 0M12 17v5m-4 0h8" />
      </>
    ),
    volume: (
      <>
        <path d="M11 5 6 9H2v6h4l5 4V5Z" />
        <path d="M15 9a4 4 0 0 1 0 6m3-9a8 8 0 0 1 0 12" />
      </>
    ),
    undo: <path d="M9 7 4 12l5 5M5 12h9a6 6 0 0 1 6 6" />,
  }
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name] || paths.spark}
    </svg>
  )
}

function Logo({
  size = 40,
  circle = false,
}: {
  size?: number
  circle?: boolean
}) {
  return (
    <div
      className={circle ? "logo-mark logo-mark-circle" : "logo-mark"}
      style={{ width: size, height: size }}
      aria-label="Sohoj Pay logo"
    >
      {circle && (
        <svg
          className="logo-ring"
          viewBox="0 0 120 120"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M110 53C105 24 83 9 58 10 33 10 12 30 10 56 7 82 26 108 56 110c30 2 53-17 55-44"
            stroke="#0B4EA2"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <path
            d="M105 38c4 7 6 13 6 21"
            stroke="#0B4EA2"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      )}
      <svg
        className="logo-symbol"
        viewBox="0 0 48 48"
        fill="none"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="5" fill="#FFD500" />
        <circle cx="36" cy="12" r="5" fill="#0B4EA2" />
        <path
          d="M7 21v6c0 10 7 17 17 17s17-7 17-17v-6h-9v6c0 5-3 8-8 8s-8-3-8-8v-6H7Z"
          fill="#0B4EA2"
        />
        <path
          d="M7 21v6c0 6 2.5 11 7 14l6-7c-2.5-1.2-4-3.5-4-7v-6H7Z"
          fill="#FFD500"
        />
      </svg>
    </div>
  )
}

const quickServices = [
  { name: "Send Money", bn: "টাকা পাঠান", icon: "send", color: "blue" },
  { name: "Mobile Recharge", bn: "মোবাইল রিচার্জ", icon: "phone", color: "peach" },
  { name: "Cash Out", bn: "ক্যাশ আউট", icon: "cash", color: "lavender" },
  { name: "Pay Bill", bn: "বিল পরিশোধ", icon: "receipt", color: "green" },
  { name: "Add Money", bn: "টাকা যোগ করুন", icon: "plus", color: "cream" },
  { name: "Savings", bn: "সঞ্চয়", icon: "savings", color: "blue" },
  { name: "Fund Transfer", bn: "ফান্ড ট্রান্সফার", icon: "transfer", color: "green" },
  { name: "Request Money", bn: "টাকা অনুরোধ", icon: "request", color: "peach" },
  { name: "Make Payment", bn: "পেমেন্ট করুন", icon: "bag", color: "lavender" },
  { name: "Refer & Earn", bn: "রেফার করুন", icon: "gift", color: "cream" },
  { name: "NPSB", bn: "এনপিএসবি", icon: "bank", color: "blue" },
]
const payments = [
  { name: "Traffic Fine", bn: "ট্রাফিক জরিমানা", icon: "car", color: "peach" },
  { name: "Toll", bn: "টোল", icon: "road", color: "blue" },
  { name: "Govt Payment", bn: "সরকারি পেমেন্ট", icon: "bank", color: "green" },
  { name: "Education", bn: "শিক্ষা", icon: "education", color: "lavender" },
  { name: "NGO", bn: "এনজিও", icon: "heart", color: "cream" },
  { name: "Insurance", bn: "ইনস্যুরেন্স", icon: "shield", color: "blue" },
  { name: "Donation", bn: "অনুদান", icon: "donate", color: "peach" },
  { name: "Zakat", bn: "যাকাত", icon: "moon", color: "green" },
  { name: "Ticket", bn: "টিকিট", icon: "ticket", color: "lavender" },
  { name: "Hotel", bn: "হোটেল", icon: "hotel", color: "cream" },
  { name: "Metrorail", bn: "মেট্রোরেল", icon: "train", color: "blue" },
]
const otherServices = [
  { name: "Music", bn: "মিউজিক", icon: "music", color: "peach" },
  { name: "E-learning", bn: "ই-লার্নিং", icon: "book", color: "blue" },
  { name: "Games", bn: "গেমস", icon: "game", color: "lavender" },
  { name: "Lucky Wheel", bn: "লাকি হুইল", icon: "wheel", color: "green" },
]
const wallets = [
  { title: "Primary Wallet", amount: "24,580.50", color: "blue", icon: "cash" },
  { title: "Disbursement", amount: "8,200.00", color: "peach", icon: "send" },
  {
    title: "Secondary Wallet",
    amount: "3,450.00",
    color: "lavender",
    icon: "savings",
  },
  { title: "Remittance", amount: "12,000.00", color: "green", icon: "globe" },
]
const transactions = [
  {
    title: "Sent to Farhan Ahmed",
    number: "017•• ••• 482",
    date: "Today, 10:42 AM",
    amount: "−৳ 1,250.00",
    type: "Send Money",
    icon: "send",
    color: "blue",
  },
  {
    title: "Received from Nabila",
    number: "018•• ••• 126",
    date: "Yesterday, 4:18 PM",
    amount: "+৳ 3,500.00",
    type: "Received",
    icon: "cash",
    color: "green",
  },
  {
    title: "Mobile Recharge",
    number: "019•• ••• 870",
    date: "20 May, 12:30 PM",
    amount: "−৳ 299.00",
    type: "Recharge",
    icon: "phone",
    color: "peach",
  },
  {
    title: "Payment at Agora",
    number: "Merchant payment",
    date: "19 May, 7:15 PM",
    amount: "−৳ 850.00",
    type: "Payment",
    icon: "bag",
    color: "lavender",
  },
  {
    title: "Sent to Rafi Hasan",
    number: "017•• ••• 932",
    date: "17 May, 11:05 AM",
    amount: "−৳ 600.00",
    type: "Send Money",
    icon: "send",
    color: "blue",
  },
  {
    title: "Received from Adnan",
    number: "016•• ••• 401",
    date: "15 May, 9:22 AM",
    amount: "+৳ 5,000.00",
    type: "Received",
    icon: "cash",
    color: "green",
  },
]
const promos = [
  {
    eyebrow: "JUST FOR YOU",
    title: "Little payments, big rewards.",
    text: "Get up to ৳100 cashback on your next bill payment.",
    button: "Pay a bill",
    color: "promo-blue",
    icon: "spark",
  },
  {
    eyebrow: "SEND MORE, SAVE MORE",
    title: "Good things are better shared.",
    text: "Send money to a friend and enjoy a little extra back.",
    button: "Send money",
    color: "promo-peach",
    icon: "send",
  },
  {
    eyebrow: "YOUR MONEY, YOUR WAY",
    title: "Make room for your goals.",
    text: "Start saving for the moments that matter to you.",
    button: "Explore savings",
    color: "promo-green",
    icon: "savings",
  },
]

const voiceContacts = [
  { name: "করিম স্টোর", number: "01712 345 678", label: "এজেন্ট" },
  { name: "রহিম উদ্দিন", number: "01819 876 543", label: "সাম্প্রতিক" },
  { name: "মা", number: "01911 223 344", label: "পছন্দের" },
]

function App() {
  const [page, setPage] = useState<Page>("login")
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null)
  const [authLoading, setAuthLoading] = useState(hasStoredToken())
  const [language, setLanguage] = useState<Language>("en")
  const [aiEnabledGlobally, setAiEnabledGlobally] = useState(true)
  const [balanceVisible, setBalanceVisible] = useState(false)
  const [promo, setPromo] = useState(0)
  const [historyTab, setHistoryTab] = useState<"transactions" | "summary">(
    "transactions",
  )
  const [filter, setFilter] = useState("All")
  const [month, setMonth] = useState(0)
  const [pin, setPin] = useState("")
  const [modal, setModal] = useState<string | null>(null)
  const [biometrics, setBiometrics] = useState(false)
  const [toast, setToast] = useState("")
  const [voiceMode, setVoiceMode] = useState(false)
  const [voiceOpen, setVoiceOpen] = useState(false)
  const [voiceStep, setVoiceStep] = useState<VoiceStep>("welcome")
  const [voiceListening, setVoiceListening] = useState(false)
  const [voiceInput, setVoiceInput] = useState("")
  const [voiceTranscript, setVoiceTranscript] = useState("")
  const [uiActions, setUiActions] = useState<{ type: string, value: string }[]>([])
  const [voiceRecipient, setVoiceRecipient] = useState<
    (typeof voiceContacts)[number] | null
  >(null)
  const [voiceAmount, setVoiceAmount] = useState("")
  const [agentOpen, setAgentOpen] = useState(false)
  const [agentBusy, setAgentBusy] = useState(false)
  const [voiceAgentPage, setVoiceAgentPage] = useState<VoiceAgentPage>("home")
  const [voiceAgentNavigating, setVoiceAgentNavigating] = useState(false)
  const [agentInput, setAgentInput] = useState("")
  const [conversationId, setConversationId] = useState<number>()
  const [agentMode, setAgentMode] = useState<"qa" | "ui_operator">("ui_operator")
  const [agentMessages, setAgentMessages] = useState<
    { role: "user" | "model"; content: string }[]
  >([
    {
      role: "model",
      content: "আসসালামু আলাইকুম। সহজ পে সম্পর্কে কী জানতে চান? লিখে বলুন।",
    },
  ])
  const [dbContacts, setDbContacts] = useState<ContactItem[]>([])
  const [dbTransactions, setDbTransactions] = useState<TransactionItem[]>([])

  useEffect(() => {
    if (currentUser && currentUser.role === "user") {
      getContacts().then(setDbContacts).catch(console.error)
      getTransactions().then(setDbTransactions).catch(console.error)
    }
  }, [currentUser])
  const recognitionRef = useRef<{ stop?: () => void } | null>(null)
  const feedbackAudioRef = useRef<HTMLAudioElement | null>(null)
  const bn = language === "bn"
  const t = (en: string, bangla: string) => (bn ? bangla : en)
  const months = ["May 2025", "April 2025", "March 2025"]

  useEffect(() => {
    if (!toast) return
    const timeout = window.setTimeout(() => setToast(""), 3000)
    return () => window.clearTimeout(timeout)
  }, [toast])

  useEffect(() => {
    getPublicConfig().then(config => {
      setAiEnabledGlobally(config.aiEnabled && config.aiConfigured)
      if (!config.aiEnabled || !config.aiConfigured) setVoiceMode(false)
    }).catch(() => undefined)

    if (!hasStoredToken()) {
      setAuthLoading(false)
      return
    }
    getMe()
      .then((data) => {
        setCurrentUser(data.user)
        setAiEnabledGlobally(data.aiEnabled && data.aiConfigured)
        if (!data.aiEnabled || !data.aiConfigured) setVoiceMode(false)
        setPage(data.user.role === "admin" ? "admin" : "home")
      })
      .catch(() => apiLogout())
      .finally(() => setAuthLoading(false))
  }, [])

  useEffect(() => {
    return () => {
      window.speechSynthesis?.cancel()
      recognitionRef.current?.stop?.()
    }
  }, [])

  const speakBangla = async (message: string) => {
    // Try backend TTS first
    try {
      const blob = await generateGeneralTTS(message)
      const url = URL.createObjectURL(blob)
      if (feedbackAudioRef.current) {
        feedbackAudioRef.current.pause()
        URL.revokeObjectURL(feedbackAudioRef.current.src)
      }
      const audio = new Audio(url)
      feedbackAudioRef.current = audio
      audio.onended = () => URL.revokeObjectURL(url)
      audio.onerror = () => URL.revokeObjectURL(url)
      await audio.play()
      return
    } catch (e) {
      // Backend TTS failed (e.g. quota exceeded or disabled), fallback to native browser TTS
    }

    if (!("speechSynthesis" in window)) return
    window.speechSynthesis.cancel()
    
    // Strip punctuation so the native TTS doesn't read out "comma" or "question mark"
    const cleanMessage = message.replace(/[.,!?।]/g, " ")

    const utterance = new SpeechSynthesisUtterance(cleanMessage)
    utterance.lang = "bn-BD"
    utterance.rate = 0.9
    window.speechSynthesis.speak(utterance)
  }

  const resetVoiceJourney = (speak = false) => {
    setVoiceStep("welcome")
    setVoiceInput("")
    setVoiceTranscript("")
    setVoiceRecipient(null)
    setVoiceAmount("")
    if (speak) speakBangla("আসসালামু আলাইকুম। আমি কীভাবে আপনাকে সাহায্য করতে পারি?")
  }



  const toggleVoiceMode = () => {
    const next = !voiceMode
    setVoiceMode(next)
    setVoiceOpen(next)
    setLanguage(next ? "bn" : language)
    if (next) {
      resetVoiceJourney(false)
      setVoiceAgentPage("home")
      setToast("ভয়েস সহায়তা চালু হয়েছে")
      speakBangla("আসসালামু আলাইকুম। আমি কীভাবে আপনাকে সাহায্য করতে পারি?")
    } else {
      window.speechSynthesis?.cancel()
      feedbackAudioRef.current?.pause()
      recognitionRef.current?.stop?.()
      setVoiceListening(false)
      setVoiceAgentNavigating(false)
      setVoiceAgentPage("home")
      setToast("ভয়েস সহায়তা বন্ধ হয়েছে")
    }
  }

  const voiceNavigateTo = (target: VoiceAgentPage, message: string) => {
    setVoiceAgentNavigating(true)
    setTimeout(() => {
      setVoiceAgentPage(target)
      setVoiceAgentNavigating(false)
      speakBangla(message)
    }, 800)
  }

  const setAgentStep = (step: VoiceStep, message: string) => {
    setVoiceStep(step)
    setVoiceInput("")
    speakBangla(message)
  }

  const toLatinDigits = (value: string) =>
    value.replace(/[০-৯]/g, (digit) => String("০১২৩৪৫৬৭৮৯".indexOf(digit)))

  const parseSpokenAmount = (value: string) => {
    const wordAmounts: Record<string, string> = {
      "একশ": "100",
      "দুইশ": "200",
      "তিনশ": "300",
      "চারশ": "400",
      "পাঁচশ": "500",
      "ছয়শ": "600",
      "সাতশ": "700",
      "আটশ": "800",
      "নয়শ": "900",
      "এক হাজার": "1000",
      "দুই হাজার": "2000",
      "পাঁচ হাজার": "5000",
    }
    const matchedWords = Object.entries(wordAmounts).find(([words]) =>
      value.includes(words),
    )
    if (matchedWords) return matchedWords[1]
    return toLatinDigits(value).replace(/[^0-9.]/g, "")
  }

  const handleVoiceText = (rawText: string) => {
    const text = rawText.trim()
    if (!text) return
    setVoiceTranscript(text)

    if (voiceStep === "welcome" || voiceStep === "help") {
      if (/ক্যাশ|cash|টাকা তুল|withdraw/i.test(text)) {
        setAgentStep(
          "confirm-intent",
          "আপনি ক্যাশ আউট করতে চান। এই সেবাটি কি ঠিক আছে?",
        )
      } else {
        setAgentStep(
          "help",
          "আমি ক্যাশ আউট, টাকা পাঠানো, মোবাইল রিচার্জ এবং ব্যালেন্স দেখতে সাহায্য করতে পারি। এখন ক্যাশ আউট বলে চেষ্টা করুন।",
        )
      }
      return
    }

    if (voiceStep === "recipient") {
      const digits = toLatinDigits(text).replace(/[^0-9]/g, "")
      const matched = voiceContacts.find(
        (contact) =>
          text.includes(contact.name) ||
          contact.number.replace(/\s/g, "").includes(digits),
      )
      const recipient =
        matched ||
        (digits.length >= 10
          ? { name: "নতুন এজেন্ট", number: text, label: "নতুন" }
          : null)
      if (recipient) {
        setVoiceRecipient(recipient)
        setAgentStep(
          "confirm-recipient",
          `${recipient.name}, নম্বর ${recipient.number}। এই নম্বরটি কি ঠিক আছে?`,
        )
      } else {
        speakBangla("দুঃখিত, নম্বরটি বুঝতে পারিনি। আবার বলুন অথবা তালিকা থেকে বেছে নিন।")
      }
      return
    }

    if (voiceStep === "amount") {
      const normalized = parseSpokenAmount(text)
      if (normalized && Number(normalized) > 0) {
        setVoiceAmount(normalized)
        setAgentStep(
          "confirm-amount",
          `${normalized} টাকা ক্যাশ আউট করবেন। টাকার পরিমাণ কি ঠিক আছে?`,
        )
      } else {
        speakBangla("টাকার পরিমাণটি আবার বলুন। যেমন, পাঁচশ টাকা।")
      }
    }
  }

  const startVoiceListening = () => {
    const SpeechRecognition = (
      window as unknown as {
        SpeechRecognition?: new () => any
        webkitSpeechRecognition?: new () => any
      }
    ).SpeechRecognition ||
      (
        window as unknown as {
          webkitSpeechRecognition?: new () => any
        }
      ).webkitSpeechRecognition

    if (!SpeechRecognition) {
      setToast("এই ব্রাউজারে সরাসরি ভয়েস ইনপুট নেই—নিচে লিখে বা অপশন ট্যাপ করুন")
      return
    }
    window.speechSynthesis?.cancel()
    const recognition = new SpeechRecognition()
    recognition.lang = "bn-BD"
    recognition.interimResults = false
    recognition.maxAlternatives = 1
    recognition.onstart = () => setVoiceListening(true)
    recognition.onend = () => setVoiceListening(false)
    recognition.onerror = () => {
      setVoiceListening(false)
      setToast("কথা শোনা যায়নি—আবার চেষ্টা করুন")
    }
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript
      handleVoiceText(transcript)
    }
    recognitionRef.current = recognition
    recognition.start()
  }

  const navigate = (next: Page) => {
    if (next === "admin" && currentUser?.role !== "admin") {
      setToast(t("Access Denied", "অ্যাক্সেস ডিনাইড"))
      return
    }
    setPage(next)
    setUiActions([])
    setModal(null)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }
  const signOutUser = async () => {
    await apiLogout().catch(() => undefined)
    setCurrentUser(null)
    setAgentOpen(false)
    setPage("login")
  }
  const pinLogin = () => {
    if (pin.length === 4) {
      setPin("")
      navigate("home")
      setToast("Welcome back to Sohoj Pay!")
    } else setToast("Please enter your 4-digit PIN.")
  }
  const serviceRoutes: Record<string, Page> = {
    "Cash Out": "cashout",
    "Send Money": "send-money",
    "Mobile Recharge": "recharge",
    "Pay Bill": "pay-bill",
    "Add Money": "add-money",
    "Savings": "savings",
    "Fund Transfer": "fund-transfer",
    "Request Money": "request-money",
    "Make Payment": "make-payment",
    "Refer & Earn": "refer-earn",
    "NPSB": "npsb",
  }

  const serviceClick = (name: string) => {
    const route = serviceRoutes[name]
    if (route) {
      navigate(route)
      return
    }
    setModal(name)
  }

  function LanguageButton({ small = false }: { small?: boolean }) {
    return (
      <button
        className={`language-button ${small ? "language-button-light" : ""}`}
        onClick={() => setLanguage(bn ? "en" : "bn")}
        aria-label="Change language"
      >
        <Icon name="globe" size={15} /> {bn ? "English" : "বাংলা"}
      </button>
    )
  }

  function VoiceModeToggle({ compact = false }: { compact?: boolean }) {
    if (!aiEnabledGlobally) return null;
    return (
      <button
        className={`voice-mode-toggle ${voiceMode ? "active" : ""} ${compact ? "compact" : ""}`}
        onClick={toggleVoiceMode}
        aria-pressed={voiceMode}
        aria-label={voiceMode ? "ভয়েস সহায়তা বন্ধ করুন" : "ভয়েস সহায়তা চালু করুন"}
      >
        <span className="voice-toggle-icon">
          <Icon name="mic" size={compact ? 17 : 19} />
        </span>
        {!compact && (
          <span>
            <strong>{voiceMode ? "ভয়েস মোড চালু" : "ভয়েস সহায়তা"}</strong>
            <small>{voiceMode ? "কথা বলে কাজ করুন" : "সহজভাবে ব্যবহার করুন"}</small>
          </span>
        )}
        <span className={`voice-switch ${voiceMode ? "on" : ""}`}>
          <i />
        </span>
      </button>
    )
  }

  function VoiceAssistant() {
    const prompt: Record<VoiceStep, string> = {
      welcome: "আসসালামু আলাইকুম। আমি কীভাবে আপনাকে সাহায্য করতে পারি?",
      "confirm-intent": "আপনি ক্যাশ আউট করতে চান। এই সেবাটি কি ঠিক আছে?",
      recipient: "আপনি কোন নম্বর থেকে ক্যাশ আউট করবেন?",
      "confirm-recipient": `${voiceRecipient?.name || "এই নম্বর"} — ${voiceRecipient?.number || ""}. নম্বরটি কি ঠিক আছে?`,
      amount: "কত টাকা ক্যাশ আউট করতে চান?",
      "confirm-amount": `${voiceAmount || "০"} টাকা। টাকার পরিমাণ কি ঠিক আছে?`,
      review: "সব তথ্য মিলিয়ে দেখুন। ঠিক থাকলে পরবর্তী ধাপে যান।",
      complete: "ডেমো ধাপ শেষ। আসল লেনদেনের আগে আপনার পিন লাগবে।",
      help: "আমি ক্যাশ আউট, টাকা পাঠানো, রিচার্জ ও ব্যালেন্স দেখতে সাহায্য করতে পারি।",
    }

    const selectRecipient = (contact: (typeof voiceContacts)[number]) => {
      setVoiceRecipient(contact)
      setVoiceTranscript(contact.name)
      setAgentStep(
        "confirm-recipient",
        `${contact.name}, নম্বর ${contact.number}। এই নম্বরটি কি ঠিক আছে?`,
      )
    }

    const selectAmount = (amount: string) => {
      setVoiceAmount(amount)
      setVoiceTranscript(`${amount} টাকা`)
      setAgentStep(
        "confirm-amount",
        `${amount} টাকা ক্যাশ আউট করবেন। টাকার পরিমাণ কি ঠিক আছে?`,
      )
    }

    const submitVoiceInput = () => {
      handleVoiceText(voiceInput)
      setVoiceInput("")
    }

    return (
      <>
        {!voiceOpen && (
          <button
            className="voice-fab"
            onClick={() => setVoiceOpen(true)}
            aria-label="ভয়েস সহায়তা খুলুন"
          >
            <Icon name="mic" size={25} />
            <span>কথা বলুন</span>
          </button>
        )}
        {voiceOpen && (
          <section className="voice-assistant" aria-label="বাংলা ভয়েস সহায়তা">
            <header className="voice-assistant-head">
              <span className="agent-avatar"><Icon name="spark" size={20} /></span>
              <span>
                <strong>সহজ সহকারী</strong>
                <small><i /> বাংলা ভয়েস চালু</small>
              </span>
              <button
                onClick={() => speakBangla(prompt[voiceStep])}
                aria-label="আবার শুনুন"
              >
                <Icon name="volume" size={19} />
              </button>
              <button onClick={() => setVoiceOpen(false)} aria-label="বন্ধ করুন">
                <Icon name="close" size={19} />
              </button>
            </header>

            <div className="voice-progress" aria-label="ক্যাশ আউট অগ্রগতি">
              {["সেবা", "নম্বর", "টাকা", "নিশ্চিত"].map((label, index) => {
                const current =
                  voiceStep === "welcome" || voiceStep === "confirm-intent" || voiceStep === "help"
                    ? 0
                    : voiceStep === "recipient" || voiceStep === "confirm-recipient"
                      ? 1
                      : voiceStep === "amount" || voiceStep === "confirm-amount"
                        ? 2
                        : 3
                return (
                  <span className={index <= current ? "done" : ""} key={label}>
                    <i>{index < current ? "✓" : index + 1}</i>{label}
                  </span>
                )
              })}
            </div>

            <div className="agent-message">
              <span><Icon name="volume" size={17} /></span>
              <p>{prompt[voiceStep]}</p>
            </div>
            {voiceTranscript && voiceStep !== "complete" && (
              <div className="user-message">
                <small>আপনি বলেছেন</small>
                <p>“{voiceTranscript}”</p>
              </div>
            )}

            {(voiceStep === "welcome" || voiceStep === "help") && (
              <div className="voice-options">
                <button onClick={() => handleVoiceText("আমি ৫০০ টাকা ক্যাশ আউট করতে চাই")}>ক্যাশ আউট</button>
                <button onClick={() => setAgentStep("help", prompt.help)}>কী কী করতে পারি?</button>
              </div>
            )}

            {voiceStep === "confirm-intent" && (
              <div className="confirm-actions">
                <button className="secondary-confirm" onClick={() => resetVoiceJourney(true)}>না, আবার বলব</button>
                <button className="primary-confirm" onClick={() => setAgentStep("recipient", "আপনি কোন নম্বর থেকে ক্যাশ আউট করবেন?")}>
                  হ্যাঁ, ক্যাশ আউট
                </button>
              </div>
            )}

            {voiceStep === "recipient" && (
              <div className="contact-options">
                <span className="option-label">সাম্প্রতিক নম্বর থেকে বাছুন</span>
                {voiceContacts.map((contact) => (
                  <button key={contact.number} onClick={() => selectRecipient(contact)}>
                    <span className="contact-avatar">{contact.name.charAt(0)}</span>
                    <span><strong>{contact.name}</strong><small>{contact.number} · {contact.label}</small></span>
                    <Icon name="chevron" size={17} />
                  </button>
                ))}
              </div>
            )}

            {voiceStep === "confirm-recipient" && (
              <>
                <div className="voice-selection-card">
                  <span className="contact-avatar">{voiceRecipient?.name.charAt(0)}</span>
                  <span><strong>{voiceRecipient?.name}</strong><small>{voiceRecipient?.number}</small></span>
                  <Icon name="check" size={20} />
                </div>
                <div className="confirm-actions">
                  <button className="secondary-confirm" onClick={() => setAgentStep("recipient", "ঠিক আছে। নম্বরটি আবার বলুন অথবা তালিকা থেকে বেছে নিন।")}>পরিবর্তন করুন</button>
                  <button className="primary-confirm" onClick={() => setAgentStep("amount", "কত টাকা ক্যাশ আউট করতে চান?")}>নম্বরটি ঠিক আছে</button>
                </div>
              </>
            )}

            {voiceStep === "amount" && (
              <div className="amount-options">
                <span className="option-label">একটি পরিমাণ বাছুন</span>
                <div>{["500", "1000", "2000"].map((amount) => <button key={amount} onClick={() => selectAmount(amount)}>৳ {amount}</button>)}</div>
              </div>
            )}

            {voiceStep === "confirm-amount" && (
              <>
                <div className="amount-card"><small>ক্যাশ আউটের পরিমাণ</small><strong>৳ {Number(voiceAmount || 0).toLocaleString()}</strong><span>চার্জ আনুমানিক ৳ ৯.২৫</span></div>
                <div className="confirm-actions">
                  <button className="secondary-confirm" onClick={() => setAgentStep("amount", "ঠিক আছে। টাকার পরিমাণ আবার বলুন।")}>পরিমাণ বদলান</button>
                  <button className="primary-confirm" onClick={() => setAgentStep("review", "সব তথ্য মিলিয়ে দেখুন। ঠিক থাকলে পরবর্তী ধাপে যান।")}>পরিমাণ ঠিক আছে</button>
                </div>
              </>
            )}

            {voiceStep === "review" && (
              <>
                <div className="voice-review">
                  <div><span>সেবা</span><strong>ক্যাশ আউট</strong></div>
                  <div><span>এজেন্ট</span><strong>{voiceRecipient?.name}<small>{voiceRecipient?.number}</small></strong></div>
                  <div><span>পরিমাণ</span><strong>৳ {Number(voiceAmount).toLocaleString()}</strong></div>
                  <div><span>মোট (চার্জসহ)</span><strong>৳ {(Number(voiceAmount) + 9.25).toLocaleString()}</strong></div>
                </div>
                <div className="safety-note"><Icon name="shield" size={18} /><span>আপনার অনুমতি ও পিন ছাড়া কোনো টাকা যাবে না।</span></div>
                <div className="confirm-actions">
                  <button className="secondary-confirm" onClick={() => setAgentStep("amount", "কোন তথ্য বদলাতে চান? টাকার পরিমাণ আবার বলুন।")}>তথ্য বদলান</button>
                  <button className="primary-confirm" onClick={() => setAgentStep("complete", "ডেমো ধাপ শেষ। আসল লেনদেনের আগে আপনার পিন লাগবে।")}>নিশ্চিত, পরবর্তী ধাপ</button>
                </div>
              </>
            )}

            {voiceStep === "complete" && (
              <div className="voice-complete">
                <span><Icon name="check" size={28} /></span>
                <strong>ডেমো অনুরোধ প্রস্তুত</strong>
                <p>কোনো টাকা পাঠানো হয়নি। আসল অ্যাপে এখন পিন নিশ্চিত করার নিরাপদ স্ক্রিন খুলবে।</p>
                <button onClick={() => resetVoiceJourney(true)}>আরেকটি কাজ করুন</button>
              </div>
            )}

            {!["confirm-intent", "confirm-recipient", "confirm-amount", "review", "complete"].includes(voiceStep) && (
              <div className="voice-input-row">
                <input
                  value={voiceInput}
                  onChange={(event) => setVoiceInput(event.target.value)}
                  onKeyDown={(event) => event.key === "Enter" && submitVoiceInput()}
                  placeholder={voiceStep === "amount" ? "যেমন: ৫০০ টাকা" : voiceStep === "recipient" ? "নম্বর লিখুন" : "এখানেও লিখতে পারেন"}
                  aria-label="ভয়েসের বিকল্প হিসেবে লিখুন"
                />
                {voiceInput ? (
                  <button className="send-input" onClick={submitVoiceInput} aria-label="পাঠান"><Icon name="send" size={19} /></button>
                ) : (
                  <button className={`listen-button ${voiceListening ? "listening" : ""}`} onClick={startVoiceListening} aria-label="কথা বলা শুরু করুন"><Icon name="mic" size={21} /></button>
                )}
              </div>
            )}
            <footer>
              <button onClick={() => setAgentStep("help", prompt.help)}><Icon name="help" size={15} /> সাহায্য</button>
              <span><Icon name="shield" size={14} /> প্রতিটি ধাপে আপনার নিশ্চিতকরণ লাগবে</span>
            </footer>
          </section>
        )}
      </>
    )
  }



  function ServiceGrid({ items }: { items: typeof quickServices }) {
    return (
      <div className="service-grid">
        {items.map((item) => (
          <button
            className="service-item"
            key={item.name}
            onClick={() => serviceClick(item.name)}
          >
            <span className={`service-icon tint-${item.color}`}>
              <Icon name={item.icon} size={25} strokeWidth={1.8} />
            </span>
            <span>{t(item.name, item.bn)}</span>
          </button>
        ))}
      </div>
    )
  }

  function SectionTitle({
    title,
    subtitle,
  }: {
    title: string
    subtitle?: string
  }) {
    return (
      <div className="section-title">
        <div>
          <h2>{title}</h2>
          {subtitle && <p>{subtitle}</p>}
        </div>
      </div>
    )
  }

  function Home() {
    return (
      <>
        <div className="home-hero">
          <div className="hero-content">
            <div className="mobile-hero-head">
              <button
                className="avatar-logo"
                onClick={() => navigate("splash")}
                aria-label="Open splash screen"
              >
                <Logo size={34} />
              </button>
              <div className="hero-user">
                <span>{t("Good morning,", "শুভ সকাল,")}</span>
                <strong>Raihan Ahmed</strong>
                <small>017•• ••• 826</small>
              </div>
              <LanguageButton small />
              <button
                className="notification-button"
                onClick={() => setModal("Notifications")}
                aria-label="Notifications"
              >
                <Icon name="bell" size={23} />
                <i />
              </button>
            </div>
            <div className="desktop-hero-copy">
              <span className="eyebrow">
                {t("YOUR EVERYDAY MONEY COMPANION", "আপনার প্রতিদিনের টাকার সঙ্গী")}
              </span>
              <h1>
                {t("Good morning, Raihan", "শুভ সকাল, রায়হান")}{" "}
                <span className="hero-wave">
                  <Icon name="spark" size={25} />
                </span>
              </h1>
              <p>
                {t(
                  "Everything you need, all in one easy place.",
                  "আপনার প্রয়োজনীয় সবকিছু, এক সহজ জায়গায়।",
                )}
              </p>
            </div>
            <button
              className="balance-pill"
              onClick={() => setBalanceVisible(!balanceVisible)}
              aria-label={balanceVisible ? "Hide balance" : "Show balance"}
            >
              <span className="balance-coin">৳</span>
              <span className="balance-label">
                {balanceVisible
                  ? "৳ 24,580.50"
                  : t("Tap for Balance", "ব্যালেন্স দেখুন")}
              </span>
              <Icon name={balanceVisible ? "eyeoff" : "eye"} size={17} />
            </button>
          </div>
          <div className="hero-art" aria-hidden="true">
            <div className="art-orbit orbit-one" />
            <div className="art-orbit orbit-two" />
            <div className="art-card">
              <Logo size={62} />
              <span>
                sohoj<span>pay</span>
              </span>
            </div>
            <div className="art-star star-one">
              <Icon name="spark" size={29} />
            </div>
            <div className="art-star star-two">
              <Icon name="spark" size={24} />
            </div>
          </div>
        </div>
        <div className="home-content">
          <section className="content-card quick-card">
            <SectionTitle
              title={t("What would you like to do?", "আপনি কী করতে চান?")}
              subtitle={t(
                "Your money moves, made simple",
                "টাকার লেনদেন এখন আরও সহজ",
              )}
            />
            <ServiceGrid items={quickServices} />
          </section>
          <section className="promo-section">
            <div className={`promo-card ${promos[promo].color}`}>
              <div className="promo-copy">
                <span className="promo-eyebrow">{promos[promo].eyebrow}</span>
                <h2>{promos[promo].title}</h2>
                <p>{promos[promo].text}</p>
                <button onClick={() => serviceClick(promos[promo].button)}>
                  {promos[promo].button} <Icon name="arrow" size={15} />
                </button>
              </div>
              <div className="promo-illustration" aria-hidden="true">
                <div className="promo-disc">
                  <Icon name={promos[promo].icon} size={68} strokeWidth={1.3} />
                </div>
                <span className="promo-spark spark-a">
                  <Icon name="spark" size={25} />
                </span>
                <span className="promo-spark spark-b">
                  <Icon name="spark" size={20} />
                </span>
              </div>
            </div>
            <div className="carousel-dots" aria-label="Promotion slides">
              {promos.map((item, index) => (
                <button
                  key={item.title}
                  onClick={() => setPromo(index)}
                  className={index === promo ? "active" : ""}
                  aria-label={`Show promotion ${index + 1}`}
                />
              ))}
            </div>
          </section>
          <section className="content-card">
            <SectionTitle
              title={t("Payments", "পেমেন্ট")}
              subtitle={t(
                "Every little thing, taken care of",
                "প্রতিটি প্রয়োজনের সহজ সমাধান",
              )}
            />
            <ServiceGrid items={payments} />
          </section>
          <section className="content-card">
            <SectionTitle
              title={t("Other services", "অন্যান্য সেবা")}
              subtitle={t("A little more to explore", "আরও অনেক কিছু ঘুরে দেখুন")}
            />
            <ServiceGrid items={otherServices} />
          </section>
          <div className="floating-chips">
            <button onClick={() => navigate("account")}>
              <Icon name="card" size={18} /> {t("Card", "কার্ড")}
            </button>
            <button onClick={() => setModal("Offers")}>
              <Icon name="tag" size={18} /> {t("Offers", "অফার")}
            </button>
          </div>
        </div>
      </>
    )
  }

  function Account() {
    return (
      <div className="page-content">
        <div className="page-heading">
          <div>
            <span className="eyebrow blue-eyebrow">
              {t("MY SPACE", "আমার অ্যাকাউন্ট")}
            </span>
            <h1>{t("My account", "আমার অ্যাকাউন্ট")}</h1>
            <p>
              {t(
                "A clear view of your money, all in one place.",
                "আপনার টাকার সব তথ্য এক জায়গায়।",
              )}
            </p>
          </div>
          <LanguageButton small />
        </div>
        <div className="account-layout">
          <div className="account-main">
            <div className="profile-card">
              <div className="profile-top">
                <img
                  src={photo}
                  alt="Raihan Ahmed profile"
                  className="profile-photo"
                />
                <div>
                  <span className="muted-label">
                    {t("ACCOUNT HOLDER", "অ্যাকাউন্ট হোল্ডার")}
                  </span>
                  <h2>Raihan Ahmed</h2>
                  <p>017•• ••• 826</p>
                </div>
                <span className="verified-badge">
                  <Icon name="check" size={14} />
                  <span>{t("Verified", "ভেরিফায়েড")}</span>
                </span>
              </div>
              <div className="total-balance">
                <div>
                  <span>{t("Total balance", "মোট ব্যালেন্স")}</span>
                  <strong>
                    ৳ 48,230<span>.50</span>
                  </strong>
                </div>
                <span className="total-icon">
                  <Icon name="cash" size={27} />
                </span>
              </div>
            </div>
            <SectionTitle title={t("Your wallets", "আপনার ওয়ালেট")} />
            <div className="wallet-grid">
              {wallets.map((wallet) => (
                <div
                  className={`wallet-card tint-${wallet.color}`}
                  key={wallet.title}
                >
                  <div className="wallet-card-top">
                    <span className="wallet-icon">
                      <Icon name={wallet.icon} size={23} />
                    </span>
                    <Icon name="arrow" size={18} />
                  </div>
                  <span className="wallet-name">{wallet.title}</span>
                  <strong>৳ {wallet.amount}</strong>
                </div>
              ))}
            </div>
          </div>
          <div className="account-side">
            <div className="reward-card">
              <div className="reward-icon">
                <Icon name="gift" size={29} />
              </div>
              <span>{t("CASH REWARD", "ক্যাশ রিওয়ার্ড")}</span>
              <strong>
                ৳ 250<span>.00</span>
              </strong>
              <p>
                {t(
                  "A little something extra, just for you.",
                  "শুধু আপনার জন্য বাড়তি কিছু।",
                )}
              </p>
              <button onClick={() => setModal("Cash Reward")}>
                {t("Explore rewards", "রিওয়ার্ড দেখুন")}{" "}
                <Icon name="arrow" size={16} />
              </button>
            </div>
            <div className="linked-card">
              <h3>{t("Linked services", "সংযুক্ত সেবা")}</h3>
              {[
                {
                  name: "Prepaid Card",
                  action: "Request",
                  icon: "card",
                  color: "blue",
                },
                {
                  name: "Linked Credit Card",
                  action: "Link",
                  icon: "card",
                  color: "lavender",
                },
                {
                  name: "Linked Account",
                  action: "Link",
                  icon: "bank",
                  color: "green",
                },
              ].map((item) => (
                <div className="linked-row" key={item.name}>
                  <span className={`small-icon tint-${item.color}`}>
                    <Icon name={item.icon} size={19} />
                  </span>
                  <span>{item.name}</span>
                  <button onClick={() => setModal(item.name)}>
                    <Icon name="plus" size={15} />
                    {item.action}
                  </button>
                </div>
              ))}
            </div>
            <div className="account-actions">
              <button onClick={() => setModal("Limits & Usage")}>
                {t("Limits & Usage", "লিমিট ও ব্যবহার")}{" "}
                <Icon name="chevron" size={17} />
              </button>
              <button onClick={() => setModal("Service Charges")}>
                {t("Service Charges", "সার্ভিস চার্জ")}{" "}
                <Icon name="chevron" size={17} />
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  function History() {
    const visible =
      filter === "All"
        ? dbTransactions
        : dbTransactions.filter((item) => item.type === filter)
    return (
      <div className="page-content">
        <div className="page-heading">
          <div>
            <span className="eyebrow blue-eyebrow">
              {t("MONEY IN MOTION", "লেনদেনের বিবরণ")}
            </span>
            <h1>{t("Your history", "লেনদেনের ইতিহাস")}</h1>
            <p>
              {t(
                "Every move, all in one place.",
                "আপনার প্রতিটি লেনদেন এক জায়গায়।",
              )}
            </p>
          </div>
          <LanguageButton small />
        </div>
        <div className="history-layout">
          <div className="history-main">
            <div className="segmented">
              <button
                className={historyTab === "transactions" ? "selected" : ""}
                onClick={() => setHistoryTab("transactions")}
              >
                {t("Transactions", "লেনদেন")}
              </button>
              <button
                className={historyTab === "summary" ? "selected" : ""}
                onClick={() => setHistoryTab("summary")}
              >
                {t("Summary", "সারাংশ")}
              </button>
            </div>
            {historyTab === "transactions" ? (
              <>
                <div className="filter-row">
                  {["All", "Send Money", "Cash Out", "Recharge", "Pay Bill", "Add Money"].map((item) => (
                    <button
                      className={filter === item ? "selected" : ""}
                      onClick={() => setFilter(item)}
                      key={item}
                    >
                      {item}
                    </button>
                  ))}
                </div>
                <div className="list-card">
                  <div className="list-heading">
                    <h2>{t("Recent activity", "সাম্প্রতিক লেনদেন")}</h2>
                    <span>
                      {visible.length} {t("transactions", "টি লেনদেন")}
                    </span>
                  </div>
                  {visible.map((item, index) => (
                    <button
                      className="transaction-row"
                      key={index}
                      onClick={() => setModal(item.type)}
                    >
                      <span className={`small-icon tint-${item.color}`}>
                        <Icon name={item.icon} size={22} />
                      </span>
                      <span className="transaction-info">
                        <strong>{item.type}</strong>
                        <small>
                          {item.recipient} <span>·</span> {item.date}
                        </small>
                      </span>
                      <span
                        className={`transaction-amount ${
                          item.type === "Received" ? "positive" : ""
                        }`}
                      >
                        {item.amount}
                      </span>
                      <Icon name="chevron" size={16} />
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <div className="summary-card">
                <div className="summary-head">
                  <div>
                    <span className="muted-label">
                      {t("SPENDING OVERVIEW", "খরচের সারাংশ")}
                    </span>
                    <h2>{t("Your month at a glance", "আপনার মাসের হিসাব")}</h2>
                  </div>
                  <button
                    className="month-selector"
                    onClick={() => setMonth((month + 1) % months.length)}
                  >
                    <Icon name="calendar" size={17} />
                    {months[month]}
                    <Icon name="down" size={15} />
                  </button>
                </div>
                <div className="summary-visual">
                  <div className="donut">
                    <div className="donut-center">
                      <span>{t("Total spent", "মোট খরচ")}</span>
                      <strong>৳ 12,480</strong>
                      <small>{months[month]}</small>
                    </div>
                  </div>
                  <div className="category-badges">
                    <span>
                      <i className="dot-blue" />
                      Transfers <b>42%</b>
                    </span>
                    <span>
                      <i className="dot-yellow" />
                      Bills <b>28%</b>
                    </span>
                    <span>
                      <i className="dot-lavender" />
                      Shopping <b>18%</b>
                    </span>
                    <span>
                      <i className="dot-green" />
                      Others <b>12%</b>
                    </span>
                  </div>
                </div>
                <div className="summary-breakdown">
                  <h3>{t("Breakdown", "বিস্তারিত")}</h3>
                  {[
                    {
                      name: "Transfers",
                      amount: "৳ 5,242",
                      icon: "transfer",
                      color: "blue",
                    },
                    {
                      name: "Bills & utilities",
                      amount: "৳ 3,494",
                      icon: "receipt",
                      color: "cream",
                    },
                    {
                      name: "Shopping",
                      amount: "৳ 2,246",
                      icon: "bag",
                      color: "lavender",
                    },
                    {
                      name: "Others",
                      amount: "৳ 1,498",
                      icon: "more",
                      color: "green",
                    },
                  ].map((item) => (
                    <div className="breakdown-row" key={item.name}>
                      <span className={`small-icon tint-${item.color}`}>
                        <Icon name={item.icon} size={19} />
                      </span>
                      <span>{item.name}</span>
                      <strong>{item.amount}</strong>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="history-aside">
            <div className="insight-card">
              <span className="insight-icon">
                <Icon name="spark" size={24} />
              </span>
              <span className="eyebrow">
                {t("A LITTLE INSIGHT", "একটু ধারণা")}
              </span>
              <h3>{t("You're making moves!", "আপনি এগিয়ে যাচ্ছেন!")}</h3>
              <p>
                {t(
                  "Keep track of the little things. They add up to something great.",
                  "ছোট ছোট হিসাব রাখুন, বড় লক্ষ্যে পৌঁছান।",
                )}
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  function More() {
    const groups = [
      {
        title: t("Settings", "সেটিংস"),
        items: [
          { name: "Change PIN", icon: "lock", color: "blue" },
          { name: "Language", icon: "globe", color: "peach" },
          { name: "Permissions", icon: "sliders", color: "lavender" },
        ],
      },
      {
        title: t("Support", "সহায়তা"),
        items: [
          { name: "24/7 Service", icon: "headset", color: "green" },
          { name: "FAQ", icon: "help", color: "cream" },
        ],
      },
      {
        title: t("Account services", "অ্যাকাউন্ট সেবা"),
        items: [
          { name: "Update Info", icon: "edit", color: "peach" },
          { name: "Add Contact", icon: "plus", color: "blue", action: () => navigate("add-contact") },
          { name: "Lucky Wheel", icon: "wheel", color: "lavender" },
          { name: "Enable Biometrics", icon: "fingerprint", color: "blue" },
          { name: "Refer", icon: "gift", color: "green" },
        ],
      },
      {
        title: t("Policies", "নীতিমালা"),
        items: [
          { name: "Terms & Conditions", icon: "file", color: "cream" },
          { name: "Privacy Policy", icon: "shield", color: "blue" },
        ],
      },
    ]
    return (
      <div className="page-content">
        <div className="page-heading">
          <div>
            <span className="eyebrow blue-eyebrow">
              {t("ALL THE EXTRAS", "আরও অনেক কিছু")}
            </span>
            <h1>{t("More for you", "আপনার জন্য আরও")}</h1>
            <p>
              {t(
                "The little details that make it yours.",
                "আপনার অ্যাকাউন্ট, আপনার মতো করে।",
              )}
            </p>
          </div>
          <LanguageButton small />
        </div>
        <div className="more-layout">
          <div className="more-main">
            <div className="account-session-card">
              <span className="session-avatar">
                <Icon name="user" size={21} />
              </span>
              <span>
                <small>{t("SIGNED IN AS", "লগইন করা অ্যাকাউন্ট")}</small>
                <strong>{currentUser?.name || "Raihan Ahmed"}</strong>
              </span>
              <button onClick={signOutUser}>
                <Icon name="logout" size={18} />
                {t("Log out", "লগ আউট")}
              </button>
            </div>
            {groups.map((group) => (
              <section className="settings-group" key={group.title}>
                <h2>{group.title}</h2>
                <div className="settings-list">
                  {group.items.map((item) => (
                    <button
                      className="settings-row"
                      key={item.name}
                      onClick={() => {
                        if ((item as any).action) (item as any).action()
                        else if (item.name === "Language")
                          setLanguage(bn ? "en" : "bn")
                        else if (item.name === "Enable Biometrics") {
                          setBiometrics(!biometrics)
                          setToast(
                            !biometrics
                              ? "Biometrics enabled"
                              : "Biometrics disabled",
                          )
                        } else setModal(item.name)
                      }}
                    >
                      <span className={`small-icon tint-${item.color}`}>
                        <Icon name={item.icon} size={21} />
                      </span>
                      <span>{item.name}</span>
                      {item.name === "Enable Biometrics" ? (
                        <span className={`toggle ${biometrics ? "on" : ""}`}>
                          <i />
                        </span>
                      ) : item.name === "Language" ? (
                        <span className="row-detail">
                          {bn ? "বাংলা" : "English"}
                          <Icon name="chevron" size={17} />
                        </span>
                      ) : (
                        <Icon name="chevron" size={17} />
                      )}
                    </button>
                  ))}
                </div>
              </section>
            ))}
          </div>
          <div className="more-aside">
            <div className="help-card">
              <span className="help-graphic">
                <Icon name="headset" size={38} />
              </span>
              <h3>{t("We're here for you.", "আমরা আপনার পাশে আছি।")}</h3>
              <p>
                {t(
                  "Questions? Our team is just a tap away, any time of day.",
                  "যেকোনো প্রশ্নে, যেকোনো সময় আমরা আছি।",
                )}
              </p>
              <button onClick={() => setModal("24/7 Service")}>
                {t("Get in touch", "যোগাযোগ করুন")}{" "}
                <Icon name="arrow" size={17} />
              </button>
            </div>
            <p className="app-version">Sohoj Pay · Version 1.0.0</p>
          </div>
        </div>
      </div>
    )
  }

  function AuthLogin() {
    const [username, setUsername] = useState("")
    const [password, setPassword] = useState("")
    const [loginBusy, setLoginBusy] = useState(false)
    const [loginError, setLoginError] = useState("")

    const finishLogin = (user: AuthUser) => {
      setCurrentUser(user)
      setPage(user.role === "admin" ? "admin" : "home")
      setLoginError("")
    }

    const submitLogin = async (event: React.FormEvent) => {
      event.preventDefault()
      setLoginBusy(true)
      setLoginError("")
      try {
        finishLogin(await apiLogin(username, password))
      } catch (error) {
        setLoginError(error instanceof Error ? error.message : "Login failed.")
      } finally {
        setLoginBusy(false)
      }
    }

    const useQuickLogin = async (role: "user" | "admin") => {
      setLoginBusy(true)
      setLoginError("")
      try {
        finishLogin(await quickLogin(role))
      } catch (error) {
        setLoginError(error instanceof Error ? error.message : "Quick login failed.")
      } finally {
        setLoginBusy(false)
      }
    }

    return (
      <div className="role-login-screen">
        <section className="login-showcase">
          <div className="login-brand">
            <Logo size={48} />
            <span>sohoj<b>pay</b></span>
          </div>
          <div className="login-showcase-copy">
            <span className="eyebrow">YOUR EVERYDAY MONEY COMPANION</span>
            <h1>সহজ কথায়,<br />সহজ লেনদেন।</h1>
            <p>বাংলায় লিখে বা কথা বলে আপনার ডিজিটাল ওয়ালেট ব্যবহার করুন। প্রতিটি লেনদেন থাকবে আপনার নিয়ন্ত্রণে।</p>
            <div className="login-trust-row">
              <span><Icon name="shield" size={19} /> নিরাপদ</span>
              <span><Icon name="mic" size={19} /> ভয়েস সহায়তা</span>
              <span><Icon name="help" size={19} /> ২৪/৭ সাহায্য</span>
            </div>
          </div>
        </section>
        <section className="login-panel">
          <div className="login-panel-inner">
            <span className="login-welcome-icon"><Icon name="user" size={25} /></span>
            <span className="eyebrow blue-eyebrow">SECURE SIGN IN</span>
            <h2>Welcome back</h2>
            <p>Sign in to your user or administrator account.</p>
            <form onSubmit={submitLogin} className="login-form">
              <label>
                Username
                <input value={username} onChange={(event) => setUsername(event.target.value)} placeholder="Enter username" autoComplete="username" required />
              </label>
              <label>
                Password
                <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Enter password" autoComplete="current-password" required />
              </label>
              {loginError && <div className="form-error"><Icon name="help" size={17} /> {loginError}</div>}
              <button className="login-submit" disabled={loginBusy}>
                {loginBusy ? "Signing in…" : "Sign in"} {!loginBusy && <Icon name="arrow" size={18} />}
              </button>
            </form>
            <div className="quick-login-block">
              <span><i /> Quick login for development <i /></span>
              <div>
                <button disabled={loginBusy} onClick={() => useQuickLogin("user")}>
                  <span className="quick-role-icon tint-blue"><Icon name="user" size={21} /></span>
                  <span><strong>Demo User</strong><small>Wallet and AI assistant</small></span>
                  <Icon name="chevron" size={17} />
                </button>
                <button disabled={loginBusy} onClick={() => useQuickLogin("admin")}>
                  <span className="quick-role-icon tint-lavender"><Icon name="sliders" size={21} /></span>
                  <span><strong>Demo Admin</strong><small>AI provider settings</small></span>
                  <Icon name="chevron" size={17} />
                </button>
              </div>
            </div>
            <small className="login-security"><Icon name="lock" size={14} /> Protected by Sohoj Pay security</small>
          </div>
        </section>
      </div>
    )
  }
  // ─── Add Contact Page ──────────────────────────────────────────────────────
  function AddContactPage({ onBack }: { onBack: () => void }) {
    const [name, setName] = useState("")
    const [number, setNumber] = useState("")
    const [type, setType] = useState("Personal")
    const [busy, setBusy] = useState(false)
    const [done, setDone] = useState(false)

    if (done) {
      return (
        <PageShell title="কন্ট্যাক্ট যোগ করুন" icon="plus" color="blue" onBack={onBack}>
          <div className="svc-section">
            <div className="svc-review-card">
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
                <SuccessAnimation />
              </div>
              <h3 style={{ textAlign: "center", marginBottom: 20, color: "var(--color-primary)" }}>কন্ট্যাক্ট সফলভাবে যোগ করা হয়েছে!</h3>
              <div className="svc-review-row"><span>নাম</span><strong>{name}</strong></div>
              <div className="svc-review-row"><span>নম্বর</span><strong>{number}</strong></div>
              <div className="svc-review-row"><span>ধরণ</span><strong>{type}</strong></div>
              <button className="svc-primary-btn" onClick={onBack} style={{ marginTop: 24 }}>
                হোমে ফিরে যান
              </button>
            </div>
          </div>
        </PageShell>
      )
    }

    return (
      <PageShell title="কন্ট্যাক্ট যোগ করুন" icon="plus" color="blue" onBack={onBack}>
        <div className="svc-section">
          <h3 className="svc-section-title">নতুন কন্ট্যাক্ট</h3>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 12, marginBottom: 4, opacity: 0.8 }}>নাম</label>
            <input 
              value={name} onChange={e => setName(e.target.value)}
              className="svc-amount-input" style={{ fontSize: 24, textAlign: 'left', padding: '12px', width: '100%' }}
              placeholder="নাম লিখুন"
            />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 12, marginBottom: 4, opacity: 0.8 }}>নম্বর</label>
            <PhoneInput value={number} onChange={setNumber} />
          </div>
          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', fontSize: 12, marginBottom: 8, opacity: 0.8 }}>ধরণ</label>
            <div style={{ display: 'flex', gap: 10 }}>
              {["Personal", "Agent"].map(t => (
                <button 
                  key={t}
                  onClick={() => setType(t)}
                  style={{ 
                    flex: 1, padding: 12, borderRadius: 12, border: 'none', 
                    background: type === t ? '#0B4EA2' : 'rgba(0,0,0,0.05)',
                    color: type === t ? 'white' : '#333',
                    fontWeight: 'bold', cursor: 'pointer'
                  }}
                >
                  {t === "Personal" ? "পার্সোনাল" : "এজেন্ট"}
                </button>
              ))}
            </div>
          </div>
          
          <button 
            className="svc-primary-btn" 
            disabled={busy || !name || number.length < 10} 
            onClick={async () => {
              setBusy(true)
              try {
                const avatar = name.slice(0, 1).toUpperCase() || "👤"
                const newContact = await addContact(name, number, type, avatar)
                setDbContacts(prev => [newContact, ...prev])
                setDone(true)
              } catch (e: any) {
                setToast(e.message)
              } finally {
                setBusy(false)
              }
            }}
          >
            {busy ? "যোগ করা হচ্ছে..." : "যোগ করুন"}
          </button>
        </div>
      </PageShell>
    )
  }

  function AdminPanel() {
    const [settings, setSettings] = useState<AISettings | null>(null)
    const [modelName, setModelName] = useState("gemini-2.5-flash")
    const [ttsProvider, setTtsProvider] = useState("gemini")
    const [ttsModelName, setTtsModelName] = useState("gemini-2.5-flash-preview-tts")
    const [ttsVoiceName, setTtsVoiceName] = useState("Kore")
    const [ttsEnabled, setTtsEnabled] = useState(true)
    const [apiKey, setApiKey] = useState("")
    const [cartesiaApiKey, setCartesiaApiKey] = useState("")
    const [systemPrompt, setSystemPrompt] = useState("")
    const [enabled, setEnabled] = useState(true)
    const [showKey, setShowKey] = useState(false)
    const [adminBusy, setAdminBusy] = useState(false)
    const [testState, setTestState] = useState<{ ok: boolean; message: string } | null>(null)
    const [knowledgeDocs, setKnowledgeDocs] = useState<{id: number; title: string; content: string}[]>([])
    const [docTitle, setDocTitle] = useState("")
    const [docContent, setDocContent] = useState("")
    const [docBusy, setDocBusy] = useState(false)
    const [adminTab, setAdminTab] = useState<"ai_settings" | "knowledge">("ai_settings")

    useEffect(() => {
      getAISettings()
        .then((value) => {
          setSettings(value)
          setModelName(value.modelName)
          setTtsProvider(value.ttsProvider || "gemini")
          setTtsModelName(value.ttsModelName)
          setTtsVoiceName(value.ttsVoiceName)
          setTtsEnabled(value.ttsEnabled)
          setSystemPrompt(value.systemPrompt)
          setEnabled(value.isEnabled)
        })
        .catch((error) => setTestState({ ok: false, message: error.message }))
        
      import("./api").then(api => {
        api.getKnowledgeDocuments().then(data => {
            setKnowledgeDocs(data.documents)
        }).catch(() => undefined)
      })
    }, [])

    const saveSettings = async () => {
      setAdminBusy(true)
      setTestState(null)
      try {
        const result = await saveAISettings({ provider: "gemini", ttsProvider, modelName, ttsModelName, ttsVoiceName, ttsEnabled, apiKey, cartesiaApiKey, systemPrompt, isEnabled: enabled })
        setSettings(result.settings)
        setApiKey("")
        setCartesiaApiKey("")
        setTestState({ ok: true, message: "Settings saved securely on the backend." })
      } catch (error) {
        setTestState({ ok: false, message: error instanceof Error ? error.message : "Could not save settings." })
      } finally {
        setAdminBusy(false)
      }
    }

    const testConnection = async () => {
      setAdminBusy(true)
      setTestState(null)
      try {
        const result = await testAIConnection(modelName, apiKey)
        setTestState({ ok: true, message: `${result.message} Model replied: ${result.response}` })
      } catch (error) {
        setTestState({ ok: false, message: error instanceof Error ? error.message : "Connection failed." })
      } finally {
        setAdminBusy(false)
      }
    }

    const testVoice = async () => {
      setAdminBusy(true)
      setTestState(null)
      try {
        const blob = await testTTSConnection(ttsProvider, ttsModelName, ttsVoiceName, apiKey, cartesiaApiKey)
        const url = URL.createObjectURL(blob)
        const audio = new Audio(url)
        audio.onended = () => URL.revokeObjectURL(url)
        await audio.play()
        setTestState({ ok: true, message: "Bangla voice connection successful. Test audio is playing." })
      } catch (error) {
        setTestState({ ok: false, message: error instanceof Error ? error.message : "Voice connection failed." })
      } finally {
        setAdminBusy(false)
      }
    }

    const signOut = async () => {
      await apiLogout().catch(() => undefined)
      setCurrentUser(null)
      setPage("login")
    }

    const addDoc = async () => {
        if (!docTitle.trim() || !docContent.trim()) return
        setDocBusy(true)
        try {
            const api = await import("./api")
            const newDoc = await api.addKnowledgeDocument(docTitle, docContent)
            setKnowledgeDocs([newDoc, ...knowledgeDocs])
            setDocTitle("")
            setDocContent("")
        } catch(error) {
            alert("Error adding document: " + (error as Error).message)
        } finally {
            setDocBusy(false)
        }
    }

    const deleteDoc = async (id: number) => {
        if (!confirm("Are you sure you want to delete this document?")) return
        setDocBusy(true)
        try {
            const api = await import("./api")
            await api.deleteKnowledgeDocument(id)
            setKnowledgeDocs(knowledgeDocs.filter(d => d.id !== id))
        } catch(error) {
            alert("Error deleting document: " + (error as Error).message)
        } finally {
            setDocBusy(false)
        }
    }

    return (
      <div className="admin-shell">
        <aside className="admin-sidebar">
          <div className="admin-brand"><Logo size={40} /><span>sohoj<b>pay</b></span><small>ADMIN</small></div>
          <nav>
            <button className={adminTab === "ai_settings" ? "active" : ""} onClick={() => setAdminTab("ai_settings")}><Icon name="spark" size={20} /> AI Settings</button>
            <button className={adminTab === "knowledge" ? "active" : ""} onClick={() => setAdminTab("knowledge")}><Icon name="help" size={20} /> Knowledge Base</button>
          </nav>
          <div className="admin-user">
            <span><Icon name="user" size={19} /></span>
            <div><strong>{currentUser?.name}</strong><small>Administrator</small></div>
            <button onClick={signOut} aria-label="Sign out"><Icon name="logout" size={18} /></button>
          </div>
        </aside>
        <main className="admin-main">
          <header className="admin-topbar">
            <div><span>Administration</span><Icon name="chevron" size={14} /><strong>AI Settings</strong></div>
            <div className="admin-topbar-actions">
              <span className={`provider-status ${settings?.hasApiKey && enabled ? "online" : ""}`}><i /> {settings?.hasApiKey && enabled ? "AI configured" : "Setup required"}</span>
              <button className="admin-logout-button" onClick={signOut} title="Sign out">
                <Icon name="logout" size={17} />
                <span>Sign out</span>
              </button>
            </div>
          </header>
          <div className="admin-content">
            {adminTab === "ai_settings" ? (
              <>
                <div className="admin-heading">
                  <span className="admin-heading-icon"><Icon name="spark" size={27} /></span>
                  <div><span className="eyebrow blue-eyebrow">INTELLIGENCE LAYER</span><h1>AI provider settings</h1><p>Configure the model used by the customer assistant. API credentials never go to the browser after saving.</p></div>
                </div>
            <div className="admin-settings-grid">
              <section className="ai-settings-card">
                <div className="settings-card-head"><div><h2>Provider configuration</h2><p>Connect the assistant to Google Gemini.</p></div><span className="gemini-mark"><Icon name="spark" size={22} /></span></div>
                <div className="admin-form-grid">
                  <label>Provider<select value="gemini" disabled><option value="gemini">Google Gemini</option></select></label>
                  <label>Model name<input value={modelName} onChange={(event) => setModelName(event.target.value)} placeholder="gemini-2.5-flash" /></label>
                  <label>TTS Provider<select value={ttsProvider} onChange={(event) => {
                    const newProvider = event.target.value;
                    setTtsProvider(newProvider);
                    if (newProvider === "cartesia") {
                      if (ttsModelName.includes("gemini")) setTtsModelName("sonic-3.6");
                      if (["Kore", "Aoede", "Puck", "Charon", "Fenrir"].includes(ttsVoiceName)) setTtsVoiceName("9626c31c-bec5-4cca-baa8-f8ba9e84c8bc");
                    } else {
                      if (ttsModelName === "sonic-3.6") setTtsModelName("gemini-2.5-flash-preview-tts");
                      if (ttsVoiceName.length > 20) setTtsVoiceName("Kore");
                    }
                  }}><option value="gemini">Google Gemini</option><option value="cartesia">Cartesia</option></select></label>
                  <label>TTS model<input value={ttsModelName} onChange={(event) => setTtsModelName(event.target.value)} placeholder={ttsProvider === "cartesia" ? "sonic-multilingual" : "gemini-2.5-flash-preview-tts"} /></label>
                  <label>Voice ID/name<input value={ttsVoiceName} onChange={(event) => setTtsVoiceName(event.target.value)} placeholder={ttsProvider === "cartesia" ? "9626c31c-bec5-4cca-baa8-f8ba9e84c8bc" : "Kore"} /></label>
                  <label className="full-field">Gemini API key<div className="secret-input"><input type={showKey ? "text" : "password"} value={apiKey} onChange={(event) => setApiKey(event.target.value)} placeholder={settings?.apiKeyMasked || "Paste your Gemini API key"} /><button onClick={() => setShowKey(!showKey)} aria-label="Show or hide API key"><Icon name={showKey ? "eyeoff" : "eye"} size={19} /></button></div><small>{settings?.hasApiKey ? `A key is saved (${settings.apiKeyMasked}). Leave empty to keep it.` : "The key will be stored only on the Django server."}</small></label>
                  {ttsProvider === "cartesia" && <label className="full-field">Cartesia API key<div className="secret-input"><input type={showKey ? "text" : "password"} value={cartesiaApiKey} onChange={(event) => setCartesiaApiKey(event.target.value)} placeholder={settings?.cartesiaApiKeyMasked || "Paste your Cartesia API key"} /><button onClick={() => setShowKey(!showKey)} aria-label="Show or hide API key"><Icon name={showKey ? "eyeoff" : "eye"} size={19} /></button></div><small>{settings?.hasCartesiaApiKey ? `A key is saved (${settings.cartesiaApiKeyMasked}). Leave empty to keep it.` : "The key will be stored only on the Django server."}</small></label>}
                  <label className="full-field">System instructions<textarea rows={6} value={systemPrompt} onChange={(event) => setSystemPrompt(event.target.value)} /></label>
                  <label className="enabled-setting"><span><strong>Enable AI assistant</strong><small>Allow users to send text and voice queries.</small></span><button className={`toggle ${enabled ? "on" : ""}`} onClick={() => setEnabled(!enabled)} type="button"><i /></button></label>
                  <label className="enabled-setting"><span><strong>Enable Bangla voice feedback</strong><small>Generate spoken feedback after each approved cash-out step.</small></span><button className={`toggle ${ttsEnabled ? "on" : ""}`} onClick={() => setTtsEnabled(!ttsEnabled)} type="button"><i /></button></label>
                </div>
                {testState && <div className={`connection-result ${testState.ok ? "success" : "failure"}`}><Icon name={testState.ok ? "check" : "help"} size={18} /><span><strong>{testState.ok ? "Success" : "Connection failed"}</strong>{testState.message}</span></div>}
                <div className="admin-form-actions">
                  <button className="test-connection" disabled={adminBusy || (!apiKey && !settings?.hasApiKey)} onClick={testConnection}><Icon name="spark" size={18} /> {adminBusy ? "Checking…" : "Test connection"}</button>
                  <button className="test-connection" disabled={adminBusy || (!apiKey && !settings?.hasApiKey) || !ttsModelName} onClick={testVoice}><Icon name="volume" size={18} /> Test Bangla voice</button>
                  <button className="save-settings" disabled={adminBusy || !modelName} onClick={saveSettings}>{adminBusy ? "Please wait…" : "Save settings"}<Icon name="arrow" size={18} /></button>
                </div>
              </section>
              <aside className="admin-info-card">
                <span><Icon name="shield" size={25} /></span><h3>Safe by design</h3><p>The API key is accepted and used only by Django. Users can chat with the assistant without receiving the credential.</p>
                <div><strong>Current setup</strong><p>Provider <b>Google Gemini</b></p><p>Agent model <b>{modelName || "Not selected"}</b></p><p>Bangla voice <b>{ttsEnabled ? ttsVoiceName : "Disabled"}</b></p><p>API key <b>{settings?.hasApiKey ? "Saved" : "Missing"}</b></p></div>
              </aside>
            </div>
            </>
            ) : (
            <>
            <div className="admin-heading">
              <span className="admin-heading-icon"><Icon name="help" size={27} /></span>
              <div><span className="eyebrow blue-eyebrow">RAG SYSTEM</span><h1>Knowledge Base Documents</h1><p>Upload text documents that the AI will use to answer user queries.</p></div>
            </div>
            <div className="admin-settings-grid">
              <section className="ai-settings-card">
                <div className="settings-card-head"><div><h2>Add New Document</h2><p>Provide content for the Q&A Agent.</p></div></div>
                <div className="admin-form-grid">
                    <label className="full-field">Title<input value={docTitle} onChange={e => setDocTitle(e.target.value)} placeholder="e.g. How to use Cash Out" /></label>
                    <label className="full-field">Content<textarea rows={6} value={docContent} onChange={e => setDocContent(e.target.value)} placeholder="Enter the text content here..." /></label>
                </div>
                <div className="admin-form-actions">
                  <button className="save-settings" disabled={docBusy || !docTitle.trim() || !docContent.trim()} onClick={addDoc}>{docBusy ? "Please wait…" : "Add Document"} <Icon name="arrow" size={18} /></button>
                </div>
              </section>
              <aside className="admin-info-card">
                 <h3>Uploaded Documents ({knowledgeDocs.length})</h3>
                 <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 15 }}>
                    {knowledgeDocs.length === 0 && <p>No documents uploaded yet.</p>}
                    {knowledgeDocs.map(doc => (
                        <div key={doc.id} style={{ background: 'var(--color-bg)', padding: '10px 15px', borderRadius: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div><strong>{doc.title}</strong></div>
                            <button onClick={() => deleteDoc(doc.id)} style={{ color: 'var(--color-danger)', background: 'none', border: 'none', cursor: 'pointer' }}><Icon name="close" size={16} /></button>
                        </div>
                    ))}
                 </div>
              </aside>
            </div>
            </>
            )}
          </div>
        </main>
      </div>
    )
  }

  function AgentChat() {
    const submitAgentMessage = async (value = agentInput) => {
      const message = value.trim()
      if (!message || agentBusy) return
      setAgentMessages((items) => [...items, { role: "user", content: message }])
      setAgentInput("")
      setAgentBusy(true)
      try {
        const result = await sendAgentMessage(message, conversationId, agentMode)
        setConversationId(result.conversationId)
        setAgentMessages((items) => [...items, { role: "model", content: result.reply }])
      } catch (error) {
        setAgentMessages((items) => [...items, { role: "model", content: `দুঃখিত—${error instanceof Error ? error.message : "এখন উত্তর দেওয়া যাচ্ছে না।"}` }])
      } finally {
        setAgentBusy(false)
      }
    }

    const dictateMessage = () => {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      if (!SpeechRecognition) {
        setToast("এই ব্রাউজারে ভয়েস টাইপিং সমর্থিত নয়")
        return
      }
      const recognition = new SpeechRecognition()
      recognition.lang = "bn-BD"
      recognition.onresult = (event: any) => setAgentInput(event.results[0][0].transcript)
      recognition.onerror = () => setToast("কথা বোঝা যায়নি—আবার চেষ্টা করুন")
      recognition.start()
    }

    return (
      <>
        <button className="agent-chat-fab" onClick={() => setAgentOpen(true)}><span><Icon name="spark" size={21} /></span><span><strong>AI সহকারী</strong><small>লিখে প্রশ্ন করুন</small></span></button>
        {agentOpen && <div className="agent-chat-backdrop" onMouseDown={() => setAgentOpen(false)}>
          <section className="agent-chat-panel" onMouseDown={(event) => event.stopPropagation()}>
            <header><span><Icon name="spark" size={22} /></span><div><strong>সহজ AI সহকারী</strong><small><i /> Gemini-এর সাথে সংযুক্ত</small></div><button onClick={() => setAgentOpen(false)}><Icon name="close" size={20} /></button></header>
            <div className="agent-chat-messages">
              {agentMessages.map((message, index) => <div className={`agent-chat-message ${message.role}`} key={index}><small>{message.role === "user" ? "আপনি" : "সহজ সহকারী"}</small><p>{message.content}</p>{message.role === "model" && <button onClick={() => speakBangla(message.content)}><Icon name="volume" size={14} /> শুনুন</button>}</div>)}
              {agentBusy && <div className="agent-typing"><i /><i /><i /><span>উত্তর তৈরি হচ্ছে</span></div>}
            </div>
            
            <div style={{ display: 'flex', gap: 10, padding: '0 15px', marginTop: 10 }}>
                <button 
                  onClick={() => setAgentMode("qa")} 
                  style={{ flex: 1, padding: 8, borderRadius: 20, border: agentMode === "qa" ? '2px solid var(--color-primary)' : '1px solid #ccc', background: agentMode === "qa" ? 'var(--color-bg)' : 'transparent', cursor: 'pointer' }}>
                  Question/Answer
                </button>
                <button 
                  onClick={() => setAgentMode("ui_operator")} 
                  style={{ flex: 1, padding: 8, borderRadius: 20, border: agentMode === "ui_operator" ? '2px solid var(--color-primary)' : '1px solid #ccc', background: agentMode === "ui_operator" ? 'var(--color-bg)' : 'transparent', cursor: 'pointer' }}>
                  Agent Mode
                </button>
            </div>
            
            <div className="agent-suggestions">{["ব্যালেন্স কীভাবে দেখব?", "ক্যাশ আউট চার্জ কত?", "আমার অ্যাকাউন্ট নিরাপদ রাখব কীভাবে?"].map((item) => <button key={item} onClick={() => submitAgentMessage(item)}>{item}</button>)}</div>
            <div className="agent-chat-input"><button onClick={dictateMessage} aria-label="ভয়েস দিয়ে লিখুন"><Icon name="mic" size={20} /></button><textarea rows={1} value={agentInput} onChange={(event) => setAgentInput(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); submitAgentMessage() } }} placeholder="বাংলা বা ইংরেজিতে লিখুন…" /><button className="agent-send" disabled={!agentInput.trim() || agentBusy} onClick={() => submitAgentMessage()}><Icon name="send" size={19} /></button></div>
            <footer><Icon name="shield" size={14} /> AI কোনো লেনদেন নিজে থেকে সম্পন্ন করতে পারে না</footer>
          </section>
        </div>}
      </>
    )
  }


  // ─── Shared sub-components for service pages ────────────────────────────────
  function PageShell({ title, subtitle, icon, color, onBack, children }: {
    title: string; subtitle: string; icon: string; color: string; onBack: () => void; children: React.ReactNode
  }) {
    return (
      <div className="svc-page">
        <div className={`svc-hero svc-hero-${color}`}>
          <button className="svc-back" onClick={onBack}><Icon name="left" size={20} /></button>
          <div className="svc-hero-inner">
            <span className={`svc-hero-icon tint-${color}`}><Icon name={icon} size={28} strokeWidth={1.6} /></span>
            <div>
              <h1>{title}</h1>
              <p>{subtitle}</p>
            </div>
          </div>
        </div>
        <div className="svc-body">{children}</div>
      </div>
    )
  }

  function PhoneInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
    return (
      <div className="svc-phone-input">
        <span className="svc-phone-flag">🇧🇩 +880</span>
        <input
          value={value}
          onChange={e => onChange(e.target.value.replace(/\D/g, "").slice(0, 11))}
          placeholder="01XXXXXXXXX"
          inputMode="numeric"
        />
      </div>
    )
  }

  function AmountKeypad({ value, onChange }: { value: string; onChange: (v: string) => void }) {
    const keys = ["1","2","3","4","5","6","7","8","9","000","0","del"]
    return (
      <div className="svc-keypad">
        <div className="svc-amount-display">
          <span className="svc-currency">৳</span>
          <span className="svc-amount-val">{value || "0"}</span>
        </div>
        <div className="svc-keys">
          {keys.map(k => (
            <button key={k} onClick={() => {
              if (k === "del") onChange(value.slice(0, -1))
              else if (value === "0") onChange(k === "000" ? "0" : k)
              else onChange((value + k).slice(0, 7))
            }}>
              {k === "del" ? <Icon name="backspace" size={22} /> : k}
            </button>
          ))}
        </div>
      </div>
    )
  }



  // ─── Cash Out Page ─────────────────────────────────────────────────────────
  function CashOutPage({ onBack }: { onBack: () => void }) {
    const [step, setStep] = useState<"number" | "amount" | "review" | "done">("number")
    const [phone, setPhone] = useState("")
    const [amount, setAmount] = useState("")
    const [selectedContact, setSelectedContact] = useState<ContactItem | null>(null)

    // Voice Auto-fill from Agent
    useEffect(() => {
      if (uiActions.length === 0) return
      
      let nextPhone = phone
      let nextAmount = amount
      let nextStep = step

      for (const action of uiActions) {
        if (action.type === "fill_phone") {
          const val = action.value.trim()
          const isPhone = /^\d+$/.test(val.replace(/\s/g, ""))
          if (isPhone) {
            nextPhone = val.slice(0, 11)
            setPhone(nextPhone)
          } else {
            const matched = dbContacts.find(c =>
              c.name.toLowerCase().includes(val.toLowerCase()) ||
              val.toLowerCase().includes(c.name.toLowerCase())
            )
            if (matched) {
              nextPhone = matched.number.replace(/\s/g, "")
              setPhone(nextPhone)
              setSelectedContact(matched)
            }
          }
        } else if (action.type === "fill_amount") {
          nextAmount = action.value
          setAmount(nextAmount)
        } else if (action.type === "proceed_next") {
          if (nextStep === "number" && nextPhone.length >= 10) {
            nextStep = "amount"
          } else if (nextStep === "amount" && nextAmount) {
            nextStep = "review"
          } else if (nextStep === "review") {
            nextStep = "done"
          }
        }
      }
      
      if (nextStep !== step) {
        setStep(nextStep)
      }
    }, [uiActions, dbContacts])

    useEffect(() => {
      if (step === "done") {
        const sig = `Cash Out-${amount}-${phone}-${JSON.stringify(uiActions)}`
        const win = window as any
        win.__processedTxs = win.__processedTxs || new Set()
        if (win.__processedTxs.has(sig)) return
        win.__processedTxs.add(sig)

        addTransaction("Cash Out", amount, selectedContact?.name || phone, "Today", "Success", "download", "peach")
          .then(res => setDbTransactions(prev => [res, ...prev]))
          .catch(console.error)
      }
    }, [step, amount, phone, uiActions, selectedContact])

    const agents = dbContacts.filter(c => c.type === "Agent")

    const fee = Math.max(Number(amount) * 0.0185, 0)
    const total = Number(amount) + fee

    return (
      <PageShell title="ক্যাশ আউট" subtitle="এজেন্ট থেকে টাকা তুলুন" icon="cash" color="lavender" onBack={onBack}>
        {step === "number" && (
          <div className="svc-section">
            <h3 className="svc-section-title">এজেন্ট নম্বর</h3>
            <PhoneInput value={phone} onChange={setPhone} />
            <div className="svc-quick-label">কাছের এজেন্ট</div>
            <div className="svc-contact-list">
              {agents.map(a => (
                <button key={a.number} className="svc-contact-row" onClick={() => { setPhone(a.number); setSelectedContact(a) }}>
                  <span className="svc-avatar tint-lavender">{a.avatar}</span>
                  <span className="svc-contact-info"><strong>{a.name}</strong><small>{a.number}</small></span>
                  <Icon name="chevron" size={16} />
                </button>
              ))}
            </div>
            <button className="svc-primary-btn" disabled={phone.length < 10} onClick={() => setStep("amount")}>
              পরবর্তী ধাপ <Icon name="arrow" size={17} />
            </button>
          </div>
        )}
        {step === "amount" && (
          <div className="svc-section">
            <div className="svc-selected-contact">
              <span className="svc-avatar tint-lavender">{selectedContact?.avatar || phone[0]}</span>
              <span><strong>{selectedContact?.name || phone}</strong><small>{phone}</small></span>
              <button className="svc-change-btn" onClick={() => setStep("number")}>পরিবর্তন</button>
            </div>
            <AmountKeypad value={amount} onChange={setAmount} />
            <div className="svc-quick-amounts">
              {["500","1000","2000","5000"].map(a => (
                <button key={a} className="svc-quick-amt" onClick={() => setAmount(a)}>৳ {a}</button>
              ))}
            </div>
            <button className="svc-primary-btn" disabled={!amount || Number(amount) < 50} onClick={() => setStep("review")}>
              পরবর্তী ধাপ <Icon name="arrow" size={17} />
            </button>
          </div>
        )}
        {step === "review" && (
          <div className="svc-section">
            <div className="svc-review-card">
              <div className="svc-review-row"><span>সেবা</span><strong>ক্যাশ আউট</strong></div>
              <div className="svc-review-row"><span>এজেন্ট</span><strong>{selectedContact?.name || phone}<br /><small>{phone}</small></strong></div>
              <div className="svc-review-row"><span>পরিমাণ</span><strong>৳ {Number(amount).toLocaleString()}</strong></div>
              <div className="svc-review-row"><span>সার্ভিস চার্জ</span><strong>৳ {fee.toFixed(2)}</strong></div>
              <div className="svc-review-row svc-review-total"><span>মোট</span><strong>৳ {total.toFixed(2)}</strong></div>
            </div>
            <div className="svc-safety-note"><Icon name="shield" size={16} /><span>নিশ্চিত করুন</span></div>
            <div className="svc-row-btns">
              <button className="svc-secondary-btn" onClick={() => setStep("amount")}>পরিবর্তন</button>
              <button className="svc-primary-btn" onClick={() => setStep("done")}>নিশ্চিত করুন <Icon name="arrow" size={17} /></button>
            </div>
          </div>
        )}
        {step === "done" && (
          <div className="svc-success">
            <span className="svc-success-icon" style={{ backgroundColor: "#dcfce7", color: "#16a34a", display: "flex", justifyContent: "center", alignItems: "center" }}><Icon name="check" size={40} /></span>
            <h2>ডেমো সম্পন্ন!</h2>
            <p>আসল অ্যাপে এখন পিন দিয়ে নিশ্চিত করতে হত।</p>
            <div className="svc-done-summary">
              <div><span>পরিমাণ</span><strong>৳ {Number(amount).toLocaleString()}</strong></div>
              <div><span>এজেন্ট</span><strong>{selectedContact?.name || phone}</strong></div>
            </div>
            <button className="svc-primary-btn" onClick={onBack}>হোমে ফিরুন <Icon name="home" size={17} /></button>
          </div>
        )}
      </PageShell>
    )
  }

  // ─── Send Money Page ───────────────────────────────────────────────────────
  function SendMoneyPage({ onBack }: { onBack: () => void }) {
    const [step, setStep] = useState<"number" | "amount" | "review" | "done">("number")
    const [phone, setPhone] = useState("")
    const [amount, setAmount] = useState("")
    const [note, setNote] = useState("")
    const [selectedContact, setSelectedContact] = useState<ContactItem | null>(null)

    // Voice Auto-fill from Agent
    useEffect(() => {
      if (uiActions.length === 0) return
      
      let nextPhone = phone
      let nextAmount = amount
      let nextStep = step

      for (const action of uiActions) {
        if (action.type === "fill_phone") {
          const val = action.value.trim()
          const isPhone = /^\d+$/.test(val.replace(/\s/g, ""))
          if (isPhone) {
            nextPhone = val.slice(0, 11)
            setPhone(nextPhone)
          } else {
            const matched = dbContacts.find(c =>
              c.name.toLowerCase().includes(val.toLowerCase()) ||
              val.toLowerCase().includes(c.name.toLowerCase())
            )
            if (matched) {
              nextPhone = matched.number.replace(/\s/g, "")
              setPhone(nextPhone)
              setSelectedContact(matched)
            } else {
              nextPhone = val.slice(0, 11)
              setPhone(nextPhone)
            }
          }
        } else if (action.type === "fill_amount") {
          nextAmount = action.value
          setAmount(nextAmount)
        } else if (action.type === "proceed_next") {
          if (nextStep === "number" && nextPhone.length >= 10) {
            nextStep = "amount"
          } else if (nextStep === "amount" && nextAmount) {
            nextStep = "review"
          } else if (nextStep === "review") {
            nextStep = "done"
          }
        }
      }
      
      if (nextStep !== step) {
        setStep(nextStep)
      }
    }, [uiActions])

    useEffect(() => {
      if (step === "done") {
        const sig = `Send Money-${amount}-${phone}-${JSON.stringify(uiActions)}`
        const win = window as any
        win.__processedTxs = win.__processedTxs || new Set()
        if (win.__processedTxs.has(sig)) return
        win.__processedTxs.add(sig)

        addTransaction("Send Money", amount, selectedContact?.name || phone, "Today", "Success", "send", "blue")
          .then(res => setDbTransactions(prev => [res, ...prev]))
          .catch(console.error)
      }
    }, [step, amount, phone, uiActions, selectedContact])

    return (
      <PageShell title="টাকা পাঠান" subtitle="যেকোনো বিকাশ নম্বরে" icon="send" color="blue" onBack={onBack}>
        {step === "number" && (
          <div className="svc-section">
            <h3 className="svc-section-title">প্রাপকের নম্বর</h3>
            <PhoneInput value={phone} onChange={setPhone} />
            <div className="svc-quick-label">সাম্প্রতিক</div>
            <div className="svc-contact-list">
              {dbContacts.filter(c => c.type !== "Agent").map(c => (
                <button key={c.number} className="svc-contact-row" onClick={() => { setPhone(c.number.replace(/\s/g, "")); setSelectedContact(c) }}>
                  <span className="svc-avatar tint-blue">{c.avatar}</span>
                  <span className="svc-contact-info"><strong>{c.name}</strong><small>{c.number}</small></span>
                  <Icon name="chevron" size={16} />
                </button>
              ))}
            </div>
            <button className="svc-primary-btn" disabled={phone.length < 10} onClick={() => setStep("amount")}>পরবর্তী <Icon name="arrow" size={17} /></button>
          </div>
        )}
        {step === "amount" && (
          <div className="svc-section">
            <div className="svc-selected-contact">
              <span className="svc-avatar tint-blue">{selectedContact?.avatar || phone[0]}</span>
              <span><strong>{selectedContact?.name || phone}</strong><small>{phone}</small></span>
              <button className="svc-change-btn" onClick={() => setStep("number")}>পরিবর্তন</button>
            </div>
            <AmountKeypad value={amount} onChange={setAmount} />
            <div className="svc-quick-amounts">
              {["200","500","1000","2000"].map(a => <button key={a} className="svc-quick-amt" onClick={() => setAmount(a)}>৳ {a}</button>)}
            </div>
            <div className="svc-note-input">
              <input value={note} onChange={e => setNote(e.target.value)} placeholder="নোট যোগ করুন (ঐচ্ছিক)" />
            </div>
            <button className="svc-primary-btn" disabled={!amount || Number(amount) < 10} onClick={() => setStep("review")}>পরবর্তী <Icon name="arrow" size={17} /></button>
          </div>
        )}
        {step === "review" && (
          <div className="svc-section">
            <div className="svc-review-card">
              <div className="svc-review-row"><span>প্রাপক</span><strong>{selectedContact?.name || phone}<br /><small>{phone}</small></strong></div>
              <div className="svc-review-row"><span>পরিমাণ</span><strong>৳ {Number(amount).toLocaleString()}</strong></div>
              {note && <div className="svc-review-row"><span>নোট</span><strong>{note}</strong></div>}
              <div className="svc-review-row"><span>চার্জ</span><strong>৳ 0.00</strong></div>
              <div className="svc-review-row svc-review-total"><span>মোট</span><strong>৳ {Number(amount).toLocaleString()}</strong></div>
            </div>
            <div className="svc-safety-note"><Icon name="shield" size={16} /><span>নিশ্চিত করুন</span></div>
            <div className="svc-row-btns">
              <button className="svc-secondary-btn" onClick={() => setStep("amount")}>পরিবর্তন</button>
              <button className="svc-primary-btn" onClick={() => setStep("done")}>পাঠান <Icon name="send" size={17} /></button>
            </div>
          </div>
        )}
        {step === "done" && (
          <div className="svc-success">
            <span className="svc-success-icon" style={{ backgroundColor: "#dcfce7", color: "#16a34a", display: "flex", justifyContent: "center", alignItems: "center" }}><Icon name="check" size={40} /></span>
            <h2>ডেমো সম্পন্ন!</h2>
            <p>৳ {Number(amount).toLocaleString()} পাঠানোর অনুরোধ সম্পন্ন।</p>
            <button className="svc-primary-btn" onClick={onBack}>হোমে ফিরুন <Icon name="home" size={17} /></button>
          </div>
        )}
      </PageShell>
    )
  }

  // ─── Mobile Recharge Page ──────────────────────────────────────────────────
  function RechargePage({ onBack }: { onBack: () => void }) {
    const [step, setStep] = useState<"number" | "pack" | "done">("number")
    const [phone, setPhone] = useState("")
    const [selected, setSelected] = useState<{amount: string; validity: string} | null>(null)
    const packs = [
      { amount: "29", validity: "৭ দিন", bonus: "100 MB" },
      { amount: "49", validity: "৭ দিন", bonus: "250 MB" },
      { amount: "99", validity: "৩০ দিন", bonus: "1 GB" },
      { amount: "199", validity: "৩০ দিন", bonus: "3 GB" },
      { amount: "499", validity: "৯০ দিন", bonus: "10 GB" },
      { amount: "999", validity: "৩৬৫ দিন", bonus: "30 GB" },
    ]

    // Voice Auto-fill from Agent
    useEffect(() => {
      if (uiActions.length === 0) return
      
      let nextPhone = phone
      let nextSelected = selected
      let nextStep = step

      for (const action of uiActions) {
        if (action.type === "fill_phone") {
          const val = action.value.trim()
          nextPhone = val.slice(0, 11)
          setPhone(nextPhone)
        } else if (action.type === "fill_amount") {
          const matchedPack = packs.find(p => p.amount === action.value) || { amount: action.value, validity: "নিজস্ব", bonus: "" }
          nextSelected = matchedPack
          setSelected(nextSelected)
        } else if (action.type === "proceed_next") {
          if (nextStep === "number" && nextPhone.length >= 10) {
            nextStep = "pack"
          } else if (nextStep === "pack" && nextSelected) {
            nextStep = "done"
          }
        }
      }
      
      if (nextStep !== step) {
        setStep(nextStep)
      }
    }, [uiActions])

    useEffect(() => {
      if (step === "done" && selected) {
        addTransaction("Recharge", selected.amount, phone, "Today", "Success", "phone", "peach")
          .then(res => setDbTransactions(prev => [res, ...prev]))
          .catch(console.error)
      }
    }, [step])

    return (
      <PageShell title="মোবাইল রিচার্জ" subtitle="যেকোনো অপারেটর রিচার্জ করুন" icon="phone" color="peach" onBack={onBack}>
        {step === "number" && (
          <div className="svc-section">
            <div className="svc-operator-row">
              {["GP","Robi","BL","Airtel","Tele"].map(op => (
                <button key={op} className="svc-operator-btn">{op}</button>
              ))}
            </div>
            <h3 className="svc-section-title">মোবাইল নম্বর</h3>
            <PhoneInput value={phone} onChange={setPhone} />
            <div className="svc-quick-label">সাম্প্রতিক</div>
            <div className="svc-contact-list">
              {dbContacts.slice(0, 3).map(c => (
                <button key={c.number} className="svc-contact-row" onClick={() => setPhone(c.number.replace(/\s/g, ""))}>
                  <span className="svc-avatar tint-peach">{c.avatar}</span>
                  <span className="svc-contact-info"><strong>{c.name}</strong><small>{c.number}</small></span>
                  <Icon name="chevron" size={16} />
                </button>
              ))}
            </div>
            <button className="svc-primary-btn" disabled={phone.length < 10} onClick={() => setStep("pack")}>প্যাকেজ বেছে নিন <Icon name="arrow" size={17} /></button>
          </div>
        )}
        {step === "pack" && (
          <div className="svc-section">
            <div className="svc-selected-contact">
              <span className="svc-avatar tint-peach">📱</span>
              <span><strong>{phone}</strong><small>Grameen Phone</small></span>
              <button className="svc-change-btn" onClick={() => setStep("number")}>পরিবর্তন</button>
            </div>
            <h3 className="svc-section-title">প্যাকেজ বেছে নিন</h3>
            <div className="svc-pack-grid">
              {packs.map(p => (
                <button key={p.amount} className={`svc-pack-card ${selected?.amount === p.amount ? "selected" : ""}`} onClick={() => setSelected(p)}>
                  <strong>৳ {p.amount}</strong>
                  <span>{p.bonus}</span>
                  <small>{p.validity}</small>
                </button>
              ))}
            </div>
            <button className="svc-primary-btn" disabled={!selected} onClick={() => setStep("done")}>রিচার্জ করুন <Icon name="arrow" size={17} /></button>
          </div>
        )}
        {step === "done" && (
          <div className="svc-success">
            <span className="svc-success-icon tint-peach"><Icon name="check" size={34} /></span>
            <h2>রিচার্জ সম্পন্ন!</h2>
            <p>{phone} নম্বরে ৳ {selected?.amount} রিচার্জ হয়েছে।</p>
            <button className="svc-primary-btn" onClick={onBack}>হোমে ফিরুন <Icon name="home" size={17} /></button>
          </div>
        )}
      </PageShell>
    )
  }

  // ─── Pay Bill Page ─────────────────────────────────────────────────────────
  function PayBillPage({ onBack }: { onBack: () => void }) {
    const [step, setStep] = useState<"category" | "details" | "done">("category")
    const [category, setCategory] = useState("")
    const [billNo, setBillNo] = useState("")
    const [amount, setAmount] = useState("")
    const categories = [
      { name: "বিদ্যুৎ বিল", icon: "spark", color: "cream" },
      { name: "গ্যাস বিল", icon: "fire", color: "peach" },
      { name: "পানি বিল", icon: "globe", color: "blue" },
      { name: "ইন্টারনেট", icon: "globe", color: "lavender" },
      { name: "টেলিফোন", icon: "phone", color: "green" },
      { name: "ক্যাবল টিভি", icon: "volume", color: "cream" },
    ]
    
    useEffect(() => {
      if (uiActions.length === 0) return
      
      let nextCategory = category
      let nextBillNo = billNo
      let nextAmount = amount
      let nextStep = step

      for (const action of uiActions) {
        if (action.type === "fill_biller") {
          nextCategory = action.value
          setCategory(nextCategory)
        } else if (action.type === "fill_account") {
          nextBillNo = action.value
          setBillNo(nextBillNo)
        } else if (action.type === "fill_amount") {
          nextAmount = action.value
          setAmount(nextAmount)
        } else if (action.type === "proceed_next") {
          if (nextStep === "category" && nextCategory) {
            nextStep = "details"
          } else if (nextStep === "details" && nextBillNo && nextAmount) {
            nextStep = "done"
          }
        }
      }
      
      if (nextStep !== step) {
        setStep(nextStep)
      }
    }, [uiActions])

    useEffect(() => {
      if (step === "done") {
        addTransaction("Pay Bill", amount, `${category} - ${billNo}`, "Today", "Success", "receipt", "green")
          .then(res => setDbTransactions(prev => [res, ...prev]))
          .catch(console.error)
      }
    }, [step])

    return (
      <PageShell title="বিল পরিশোধ" subtitle="সকল ধরনের বিল এক জায়গায়" icon="receipt" color="green" onBack={onBack}>
        {step === "category" && (
          <div className="svc-section">
            <h3 className="svc-section-title">বিলের ধরন বেছে নিন</h3>
            <div className="svc-category-grid">
              {categories.map(c => (
                <button key={c.name} className="svc-category-card" onClick={() => { setCategory(c.name); setStep("details") }}>
                  <span className={`svc-avatar tint-${c.color}`}><Icon name={c.icon} size={22} /></span>
                  <span>{c.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}
        {step === "details" && (
          <div className="svc-section">
            <div className="svc-selected-contact">
              <span className="svc-avatar tint-green"><Icon name="receipt" size={20} /></span>
              <span><strong>{category}</strong></span>
              <button className="svc-change-btn" onClick={() => setStep("category")}>পরিবর্তন</button>
            </div>
            <h3 className="svc-section-title">বিল নম্বর</h3>
            <div className="svc-phone-input">
              <input value={billNo} onChange={e => setBillNo(e.target.value)} placeholder="বিল/অ্যাকাউন্ট নম্বর লিখুন" />
            </div>
            <AmountKeypad value={amount} onChange={setAmount} />
            <button className="svc-primary-btn" disabled={!billNo || !amount} onClick={() => setStep("done")}>পরিশোধ করুন <Icon name="arrow" size={17} /></button>
          </div>
        )}
        {step === "done" && (
          <div className="svc-success">
            <span className="svc-success-icon"><Icon name="check" size={34} /></span>
            <h2>বিল পরিশোধ সম্পন্ন!</h2>
            <p>{category} — ৳ {Number(amount).toLocaleString()}</p>
            <button className="svc-primary-btn" onClick={onBack}>হোমে ফিরুন</button>
          </div>
        )}
      </PageShell>
    )
  }

  // ─── Add Money Page ────────────────────────────────────────────────────────
  function AddMoneyPage({ onBack }: { onBack: () => void }) {
    const [method, setMethod] = useState("")
    const [amount, setAmount] = useState("")
    const [step, setStep] = useState<"method" | "amount" | "done">("method")
    const methods = [
      { name: "ব্যাংক ট্রান্সফার", icon: "bank", color: "blue", sub: "যেকোনো ব্যাংক থেকে" },
      { name: "ডেবিট কার্ড", icon: "card", color: "lavender", sub: "Visa / Mastercard" },
      { name: "NPSB", icon: "transfer", color: "green", sub: "ইন্টারব্যাংক ট্রান্সফার" },
    ]

    useEffect(() => {
      if (uiActions.length === 0) return
      
      let nextMethod = method
      let nextAmount = amount
      let nextStep = step

      for (const action of uiActions) {
        if (action.type === "fill_bank") {
          nextMethod = action.value
          setMethod(nextMethod)
        } else if (action.type === "fill_amount") {
          nextAmount = action.value
          setAmount(nextAmount)
        } else if (action.type === "proceed_next") {
          if (nextStep === "method" && nextMethod) {
            nextStep = "amount"
          } else if (nextStep === "amount" && nextAmount) {
            nextStep = "done"
          }
        }
      }
      
      if (nextStep !== step) {
        setStep(nextStep)
      }
    }, [uiActions])

    useEffect(() => {
      if (step === "done") {
        addTransaction("Add Money", amount, method, "Today", "Success", "plus", "cream")
          .then(res => setDbTransactions(prev => [res, ...prev]))
          .catch(console.error)
      }
    }, [step])

    return (
      <PageShell title="টাকা যোগ করুন" subtitle="আপনার ওয়ালেটে টাকা লোড করুন" icon="plus" color="cream" onBack={onBack}>
        {step === "method" && (
          <div className="svc-section">
            <h3 className="svc-section-title">পদ্ধতি বেছে নিন</h3>
            {methods.map(m => (
              <button key={m.name} className="svc-method-row" onClick={() => { setMethod(m.name); setStep("amount") }}>
                <span className={`svc-avatar tint-${m.color}`}><Icon name={m.icon} size={22} /></span>
                <span className="svc-contact-info"><strong>{m.name}</strong><small>{m.sub}</small></span>
                <Icon name="chevron" size={16} />
              </button>
            ))}
          </div>
        )}
        {step === "amount" && (
          <div className="svc-section">
            <div className="svc-selected-contact">
              <span className="svc-avatar tint-cream"><Icon name="bank" size={20} /></span>
              <span><strong>{method}</strong></span>
              <button className="svc-change-btn" onClick={() => setStep("method")}>পরিবর্তন</button>
            </div>
            <AmountKeypad value={amount} onChange={setAmount} />
            <div className="svc-quick-amounts">
              {["500","1000","5000","10000"].map(a => <button key={a} className="svc-quick-amt" onClick={() => setAmount(a)}>৳ {a}</button>)}
            </div>
            <button className="svc-primary-btn" disabled={!amount || Number(amount) < 100} onClick={() => setStep("done")}>টাকা যোগ করুন <Icon name="arrow" size={17} /></button>
          </div>
        )}
        {step === "done" && (
          <div className="svc-success">
            <span className="svc-success-icon"><Icon name="check" size={34} /></span>
            <h2>টাকা যোগ সম্পন্ন!</h2>
            <p>৳ {Number(amount).toLocaleString()} ওয়ালেটে যোগ হয়েছে।</p>
            <button className="svc-primary-btn" onClick={onBack}>হোমে ফিরুন</button>
          </div>
        )}
      </PageShell>
    )
  }

  // ─── Savings Page ──────────────────────────────────────────────────────────
  function SavingsPage({ onBack }: { onBack: () => void }) {
    const [tab, setTab] = useState<"plans" | "create">("plans")
    const plans = [
      { name: "মাসিক সঞ্চয়", goal: "50,000", saved: "12,500", rate: "7%", color: "blue" },
      { name: "জরুরি তহবিল", goal: "20,000", saved: "8,000", rate: "5%", color: "green" },
    ]

    useEffect(() => {
      if (uiActions.length === 0) return
      for (const action of uiActions) {
        if (action.type === "proceed_next") {
          if (tab === "plans") setTab("create")
        }
      }
    }, [uiActions, tab])

    return (
      <PageShell title="সঞ্চয়" subtitle="আপনার লক্ষ্যের জন্য সঞ্চয় করুন" icon="savings" color="blue" onBack={onBack}>
        <div className="svc-section">
          <div className="svc-tabs">
            <button className={tab === "plans" ? "active" : ""} onClick={() => setTab("plans")}>আমার পরিকল্পনা</button>
            <button className={tab === "create" ? "active" : ""} onClick={() => setTab("create")}>নতুন সঞ্চয়</button>
          </div>
          {tab === "plans" && (
            <>
              {plans.map(p => (
                <div key={p.name} className={`svc-savings-card tint-${p.color}`}>
                  <div className="svc-savings-head">
                    <strong>{p.name}</strong>
                    <span className="svc-rate-badge">{p.rate} বার্ষিক</span>
                  </div>
                  <div className="svc-savings-progress-bar">
                    <div style={{ width: `${(parseInt(p.saved.replace(",","")) / parseInt(p.goal.replace(",",""))) * 100}%` }} />
                  </div>
                  <div className="svc-savings-amounts">
                    <span>সঞ্চিত: ৳ {p.saved}</span>
                    <span>লক্ষ্য: ৳ {p.goal}</span>
                  </div>
                </div>
              ))}
              <button className="svc-primary-btn" onClick={() => setTab("create")}>নতুন পরিকল্পনা <Icon name="plus" size={17} /></button>
            </>
          )}
          {tab === "create" && (
            <div className="svc-create-savings">
              <div className="svc-form-group">
                <label>পরিকল্পনার নাম</label>
                <input placeholder="যেমন: ঈদের জন্য সঞ্চয়" />
              </div>
              <div className="svc-form-group">
                <label>লক্ষ্যমাত্রা</label>
                <input placeholder="৳ পরিমাণ লিখুন" inputMode="numeric" />
              </div>
              <div className="svc-form-group">
                <label>মাসিক কিস্তি</label>
                <input placeholder="প্রতি মাসে কত?" inputMode="numeric" />
              </div>
              <button className="svc-primary-btn">পরিকল্পনা তৈরি করুন <Icon name="check" size={17} /></button>
            </div>
          )}
        </div>
      </PageShell>
    )
  }

  // ─── Fund Transfer Page ────────────────────────────────────────────────────
  function FundTransferPage({ onBack }: { onBack: () => void }) {
    const [step, setStep] = useState<"from" | "to" | "amount" | "done">("from")
    const [fromWallet, setFromWallet] = useState("")
    const [amount, setAmount] = useState("")
    const wallets = ["প্রাথমিক ওয়ালেট · ৳ 24,580", "ডিসবার্সমেন্ট · ৳ 8,200", "সেকেন্ডারি ওয়ালেট · ৳ 3,450"]

    useEffect(() => {
      if (uiActions.length === 0) return
      
      let nextFromWallet = fromWallet
      let nextAmount = amount
      let nextStep = step

      for (const action of uiActions) {
        if (action.type === "fill_account") {
          nextFromWallet = action.value
          setFromWallet(nextFromWallet)
        } else if (action.type === "fill_amount") {
          nextAmount = action.value
          setAmount(nextAmount)
        } else if (action.type === "proceed_next") {
          if (nextStep === "from" && nextFromWallet) {
            nextStep = "amount"
          } else if (nextStep === "amount" && nextAmount) {
            nextStep = "done"
          }
        }
      }
      
      if (nextStep !== step) {
        setStep(nextStep)
      }
    }, [uiActions])

    useEffect(() => {
      if (step === "done") {
        addTransaction("Fund Transfer", amount, fromWallet.split("·")[0].trim(), "Today", "Success", "transfer", "green")
          .then(res => setDbTransactions(prev => [res, ...prev]))
          .catch(console.error)
      }
    }, [step])

    return (
      <PageShell title="ফান্ড ট্রান্সফার" subtitle="ওয়ালেটের মধ্যে টাকা সরান" icon="transfer" color="green" onBack={onBack}>
        <div className="svc-section">
          {step === "from" && (
            <>
              <h3 className="svc-section-title">কোথা থেকে?</h3>
              {wallets.map(w => (
                <button key={w} className="svc-method-row" onClick={() => { setFromWallet(w); setStep("amount") }}>
                  <span className="svc-avatar tint-green"><Icon name="cash" size={20} /></span>
                  <span className="svc-contact-info"><strong>{w.split("·")[0].trim()}</strong><small>{w.split("·")[1]?.trim()}</small></span>
                  <Icon name="chevron" size={16} />
                </button>
              ))}
            </>
          )}
          {step === "amount" && (
            <>
              <div className="svc-selected-contact">
                <span className="svc-avatar tint-green"><Icon name="cash" size={20} /></span>
                <span><strong>{fromWallet.split("·")[0]}</strong></span>
                <button className="svc-change-btn" onClick={() => setStep("from")}>পরিবর্তন</button>
              </div>
              <h3 className="svc-section-title">কোথায়?</h3>
              {wallets.filter(w => w !== fromWallet).map(w => (
                <button key={w} className="svc-method-row" onClick={() => setStep("done")}>
                  <span className="svc-avatar tint-blue"><Icon name="cash" size={20} /></span>
                  <span className="svc-contact-info"><strong>{w.split("·")[0].trim()}</strong></span>
                  <Icon name="chevron" size={16} />
                </button>
              ))}
              <AmountKeypad value={amount} onChange={setAmount} />
              <button className="svc-primary-btn" disabled={!amount} onClick={() => setStep("done")}>ট্রান্সফার <Icon name="arrow" size={17} /></button>
            </>
          )}
          {step === "done" && (
            <div className="svc-success">
              <span className="svc-success-icon"><Icon name="check" size={34} /></span>
              <h2>ট্রান্সফার সম্পন্ন!</h2>
              <p>ডেমো ট্রান্সফার সফলভাবে সম্পন্ন হয়েছে।</p>
              <button className="svc-primary-btn" onClick={onBack}>হোমে ফিরুন</button>
            </div>
          )}
        </div>
      </PageShell>
    )
  }

  // ─── Request Money Page ────────────────────────────────────────────────────
  function RequestMoneyPage({ onBack }: { onBack: () => void }) {
    const [phone, setPhone] = useState("")
    const [amount, setAmount] = useState("")
    const [note, setNote] = useState("")
    const [done, setDone] = useState(false)

    useEffect(() => {
      if (uiActions.length === 0) return
      
      let nextPhone = phone
      let nextAmount = amount
      let nextDone = done

      for (const action of uiActions) {
        if (action.type === "fill_phone") {
          nextPhone = action.value
          setPhone(nextPhone)
        } else if (action.type === "fill_amount") {
          nextAmount = action.value
          setAmount(nextAmount)
        } else if (action.type === "proceed_next") {
          if (!nextDone && nextPhone && nextAmount) {
            nextDone = true
          }
        }
      }
      
      if (nextDone !== done) {
        setDone(nextDone)
      }
    }, [uiActions])

    useEffect(() => {
      if (done) {
        addTransaction("Request Money", amount, phone, "Today", "Pending", "request", "peach")
          .then(res => setDbTransactions(prev => [res, ...prev]))
          .catch(console.error)
      }
    }, [done])

    return (
      <PageShell title="টাকা অনুরোধ" subtitle="বন্ধু বা পরিবার থেকে টাকা চান" icon="request" color="peach" onBack={onBack}>
        <div className="svc-section">
          {!done ? (
            <>
              <h3 className="svc-section-title">কার কাছ থেকে?</h3>
              <PhoneInput value={phone} onChange={setPhone} />
              <div className="svc-contact-list">
                {dbContacts.map(c => (
                  <button key={c.number} className="svc-contact-row" onClick={() => setPhone(c.number.replace(/\s/g,""))}>
                    <span className="svc-avatar tint-peach">{c.avatar}</span>
                    <span className="svc-contact-info"><strong>{c.name}</strong><small>{c.number}</small></span>
                  </button>
                ))}
              </div>
              <AmountKeypad value={amount} onChange={setAmount} />
              <div className="svc-note-input"><input value={note} onChange={e => setNote(e.target.value)} placeholder="কারণ লিখুন (ঐচ্ছিক)" /></div>
              <button className="svc-primary-btn" disabled={!phone || !amount} onClick={() => setDone(true)}>অনুরোধ পাঠান <Icon name="send" size={17} /></button>
            </>
          ) : (
            <div className="svc-success">
              <span className="svc-success-icon"><Icon name="check" size={34} /></span>
              <h2>অনুরোধ পাঠানো হয়েছে!</h2>
              <p>৳ {Number(amount).toLocaleString()} এর অনুরোধ পাঠানো হয়েছে।</p>
              <button className="svc-primary-btn" onClick={onBack}>হোমে ফিরুন</button>
            </div>
          )}
        </div>
      </PageShell>
    )
  }

  // ─── Make Payment Page ─────────────────────────────────────────────────────
  function MakePaymentPage({ onBack }: { onBack: () => void }) {
    const [step, setStep] = useState<"scan" | "amount" | "done">("scan")
    const [amount, setAmount] = useState("")
    const merchants = [
      { name: "Agora Supershop", id: "AGR001", avatar: "A" },
      { name: "Shajgoj", id: "SHJ002", avatar: "S" },
      { name: "Chaldal", id: "CHL003", avatar: "C" },
    ]

    useEffect(() => {
      if (uiActions.length === 0) return
      
      let nextAmount = amount
      let nextStep = step

      for (const action of uiActions) {
        if (action.type === "fill_merchant") {
          nextStep = "amount"
        } else if (action.type === "fill_amount") {
          nextAmount = action.value
          setAmount(nextAmount)
        } else if (action.type === "proceed_next") {
          if (nextStep === "scan") {
            nextStep = "amount"
          } else if (nextStep === "amount" && nextAmount) {
            nextStep = "done"
          }
        }
      }
      
      if (nextStep !== step) {
        setStep(nextStep)
      }
    }, [uiActions])

    useEffect(() => {
      if (step === "done") {
        addTransaction("Make Payment", amount, "Merchant", "Today", "Success", "bag", "lavender")
          .then(res => setDbTransactions(prev => [res, ...prev]))
          .catch(console.error)
      }
    }, [step])

    return (
      <PageShell title="পেমেন্ট করুন" subtitle="কিউআর স্ক্যান বা মার্চেন্ট আইডি" icon="bag" color="lavender" onBack={onBack}>
        <div className="svc-section">
          {step === "scan" && (
            <>
              <div className="svc-qr-box">
                <Icon name="scan" size={72} strokeWidth={1} />
                <span>QR কোড স্ক্যান করুন</span>
                <small>ক্যামেরা ব্যবহারের অনুমতি দিন</small>
              </div>
              <div className="svc-or-divider"><i /><span>অথবা</span><i /></div>
              <h3 className="svc-section-title">সাম্প্রতিক মার্চেন্ট</h3>
              {merchants.map(m => (
                <button key={m.id} className="svc-contact-row" onClick={() => setStep("amount")}>
                  <span className="svc-avatar tint-lavender">{m.avatar}</span>
                  <span className="svc-contact-info"><strong>{m.name}</strong><small>ID: {m.id}</small></span>
                  <Icon name="chevron" size={16} />
                </button>
              ))}
            </>
          )}
          {step === "amount" && (
            <>
              <div className="svc-selected-contact">
                <span className="svc-avatar tint-lavender">A</span>
                <span><strong>Agora Supershop</strong><small>AGR001</small></span>
              </div>
              <AmountKeypad value={amount} onChange={setAmount} />
              <button className="svc-primary-btn" disabled={!amount} onClick={() => setStep("done")}>পেমেন্ট করুন <Icon name="arrow" size={17} /></button>
            </>
          )}
          {step === "done" && (
            <div className="svc-success">
              <span className="svc-success-icon"><Icon name="check" size={34} /></span>
              <h2>পেমেন্ট সম্পন্ন!</h2>
              <p>৳ {Number(amount).toLocaleString()} পেমেন্ট হয়েছে।</p>
              <button className="svc-primary-btn" onClick={onBack}>হোমে ফিরুন</button>
            </div>
          )}
        </div>
      </PageShell>
    )
  }

  // ─── Refer & Earn Page ─────────────────────────────────────────────────────
  function ReferEarnPage({ onBack }: { onBack: () => void }) {
    const code = "RAIHAN50"
    const [copied, setCopied] = useState(false)
    const copyCode = () => {
      navigator.clipboard?.writeText(code).catch(() => {})
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
    return (
      <PageShell title="রেফার করুন ও আয় করুন" subtitle="বন্ধুকে আমন্ত্রণ জানান" icon="gift" color="cream" onBack={onBack}>
        <div className="svc-section">
          <div className="svc-refer-hero">
            <div className="svc-refer-illustration">
              <Icon name="gift" size={60} strokeWidth={1.2} />
            </div>
            <h2>প্রতি রেফারে ৳ 50</h2>
            <p>আপনার বন্ধু প্রথমবার ব্যবহার করলে আপনি পাবেন ৳ 50, তারাও পাবে ৳ 25!</p>
          </div>
          <div className="svc-refer-code-box">
            <span className="svc-refer-label">আপনার রেফার কোড</span>
            <div className="svc-refer-code">
              <strong>{code}</strong>
              <button className="svc-copy-btn" onClick={copyCode}>
                {copied ? <><Icon name="check" size={15} /> কপি হয়েছে!</> : <><Icon name="file" size={15} /> কপি করুন</>}
              </button>
            </div>
          </div>
          <div className="svc-refer-stats">
            <div className="svc-refer-stat"><strong>12</strong><span>রেফার করেছেন</span></div>
            <div className="svc-refer-stat"><strong>৳ 600</strong><span>মোট আয়</span></div>
            <div className="svc-refer-stat"><strong>8</strong><span>সফল</span></div>
          </div>
          <button className="svc-primary-btn"><Icon name="send" size={17} /> বন্ধুকে শেয়ার করুন</button>
        </div>
      </PageShell>
    )
  }

  // ─── NPSB Page ─────────────────────────────────────────────────────────────
  function NPSBPage({ onBack }: { onBack: () => void }) {
    const [step, setStep] = useState<"bank" | "account" | "amount" | "done">("bank")
    const [bank, setBank] = useState("")
    const [accountNo, setAccountNo] = useState("")
    const [amount, setAmount] = useState("")
    const banks = ["Dutch Bangla Bank", "BRAC Bank", "City Bank", "Islami Bank", "Sonali Bank", "Agrani Bank"]

    useEffect(() => {
      if (uiActions.length === 0) return
      
      let nextBank = bank
      let nextAccountNo = accountNo
      let nextAmount = amount
      let nextStep = step

      for (const action of uiActions) {
        if (action.type === "fill_bank") {
          nextBank = action.value
          setBank(nextBank)
        } else if (action.type === "fill_account") {
          nextAccountNo = action.value
          setAccountNo(nextAccountNo)
        } else if (action.type === "fill_amount") {
          nextAmount = action.value
          setAmount(nextAmount)
        } else if (action.type === "proceed_next") {
          if (nextStep === "bank" && nextBank) {
            nextStep = "account"
          } else if (nextStep === "account" && nextAccountNo) {
            nextStep = "amount"
          } else if (nextStep === "amount" && nextAmount) {
            nextStep = "done"
          }
        }
      }
      
      if (nextStep !== step) {
        setStep(nextStep)
      }
    }, [uiActions])

    useEffect(() => {
      if (step === "done") {
        addTransaction("NPSB Transfer", amount, `${bank} - ${accountNo}`, "Today", "Success", "bank", "blue")
          .then(res => setDbTransactions(prev => [res, ...prev]))
          .catch(console.error)
      }
    }, [step])

    return (
      <PageShell title="NPSB ট্রান্সফার" subtitle="ইন্টারব্যাংক তাৎক্ষণিক ট্রান্সফার" icon="bank" color="blue" onBack={onBack}>
        <div className="svc-section">
          {step === "bank" && (
            <>
              <h3 className="svc-section-title">প্রাপকের ব্যাংক</h3>
              <div className="svc-bank-list">
                {banks.map(b => (
                  <button key={b} className="svc-contact-row" onClick={() => { setBank(b); setStep("account") }}>
                    <span className="svc-avatar tint-blue"><Icon name="bank" size={20} /></span>
                    <span className="svc-contact-info"><strong>{b}</strong></span>
                    <Icon name="chevron" size={16} />
                  </button>
                ))}
              </div>
            </>
          )}
          {step === "account" && (
            <>
              <div className="svc-selected-contact">
                <span className="svc-avatar tint-blue"><Icon name="bank" size={20} /></span>
                <span><strong>{bank}</strong></span>
                <button className="svc-change-btn" onClick={() => setStep("bank")}>পরিবর্তন</button>
              </div>
              <h3 className="svc-section-title">অ্যাকাউন্ট নম্বর</h3>
              <div className="svc-phone-input">
                <input value={accountNo} onChange={e => setAccountNo(e.target.value.replace(/\D/g, ""))} placeholder="অ্যাকাউন্ট/রাউটিং নম্বর" inputMode="numeric" />
              </div>
              <button className="svc-primary-btn" disabled={accountNo.length < 6} onClick={() => setStep("amount")}>পরবর্তী <Icon name="arrow" size={17} /></button>
            </>
          )}
          {step === "amount" && (
            <>
              <div className="svc-selected-contact">
                <span className="svc-avatar tint-blue"><Icon name="bank" size={20} /></span>
                <span><strong>{bank}</strong><small>{accountNo}</small></span>
              </div>
              <AmountKeypad value={amount} onChange={setAmount} />
              <div className="svc-info-note"><Icon name="spark" size={14} /><span>NPSB চার্জ: ৳ 10 প্রতি ট্রান্সফার</span></div>
              <button className="svc-primary-btn" disabled={!amount || Number(amount) < 100} onClick={() => setStep("done")}>ট্রান্সফার করুন <Icon name="arrow" size={17} /></button>
            </>
          )}
          {step === "done" && (
            <div className="svc-success">
              <span className="svc-success-icon"><Icon name="check" size={34} /></span>
              <h2>NPSB ট্রান্সফার সম্পন্ন!</h2>
              <p>{bank} এ ৳ {Number(amount).toLocaleString()} পাঠানো হয়েছে।</p>
              <button className="svc-primary-btn" onClick={onBack}>হোমে ফিরুন</button>
            </div>
          )}
        </div>
      </PageShell>
    )
  }


  // ── Voice Status Badge ─────────────────────────────────────────────────────
  function VoiceStatusBadge() {
    const [speaking, setSpeaking] = useState(false)

    // Track if TTS is playing (speechSynthesis or audio element)
    useEffect(() => {
      const check = setInterval(() => {
        const syn = window.speechSynthesis?.speaking ?? false
        const audio = feedbackAudioRef.current ? !feedbackAudioRef.current.paused : false
        setSpeaking(syn || audio)
      }, 200)
      return () => clearInterval(check)
    }, [])

    const transcriptRef = useRef("")

    const startListening = () => {
      if (voiceListening || agentBusy || speaking) return
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      if (!SpeechRecognition) return
      const r = new SpeechRecognition()
      r.lang = "bn-BD"
      r.continuous = true
      r.interimResults = true
      
      r.onstart = () => {
        setVoiceListening(true)
        transcriptRef.current = ""
      }
      r.onend = () => {
        setVoiceListening(false)
      }
      r.onerror = () => {
        setVoiceListening(false)
      }
      r.onresult = (e: any) => {
        let finalTranscript = ""
        for (let i = e.resultIndex; i < e.results.length; ++i) {
          if (e.results[i].isFinal) {
            finalTranscript += e.results[i][0].transcript
          }
        }
        
        if (finalTranscript) {
          transcriptRef.current = (transcriptRef.current + " " + finalTranscript).trim()
        }
        
        // Show current progress in toast (including interim)
        let interimTranscript = ""
        for (let i = e.resultIndex; i < e.results.length; ++i) {
          if (!e.results[i].isFinal) {
            interimTranscript += e.results[i][0].transcript
          }
        }
        
        const display = (transcriptRef.current + " " + interimTranscript).trim()
        if (display) {
          setToast(`"${display}"`)
          setVoiceTranscript(display)
        }
      }
      recognitionRef.current = r
      r.start()
    }

    const stopAndSend = async () => {
      recognitionRef.current?.stop?.()
      
      // Use voiceTranscript which includes interim results just in case isFinal hasn't fired
      setVoiceTranscript((currentDisplayTranscript) => {
        const transcript = currentDisplayTranscript.trim() || transcriptRef.current.trim()
        if (!transcript) return ""
        
        // Execute API call immediately
        ;(async () => {
          setAgentBusy(true)
          // Build history snapshot for this call
          const historySnapshot = agentMessages.map(m => ({ role: m.role === "user" ? "user" : "model", content: m.content }))
          try {
            const res = await fetch("/api/agent/voice-agent/", {
              method: "POST",
              headers: { "Content-Type": "application/json", "Authorization": `Bearer ${localStorage.getItem("sohoj_pay_api_token")}` },
              body: JSON.stringify({
                transcript,
                currentPage: page,
                currentStep: voiceStep,
                mode: agentMode,
                conversationHistory: historySnapshot,
              })
            });
            if (!res.ok) throw new Error("API error");
            const data = await res.json();
            
            if (data.actions && data.actions.length > 0) {
              // Track user turn in history
              setAgentMessages(prev => [...prev, { role: "user", content: transcript }])
              
              // Check if there's a navigate action — if so, delay fill actions
              const hasNavigate = data.actions.some((a: any) => a.type === "navigate")
              
              for (const action of data.actions) {
                if (action.type === "navigate" && action.value) {
                   navigate(action.value as Page);
                } else if (action.type === "speak" && action.value) {
                   speakBangla(action.value);
                   setAgentMessages(prev => [...prev, { role: "model", content: action.value }])
                }
              }
              
              // Set uiActions after a delay if we navigated, so the new page can mount first
              if (hasNavigate) {
                setTimeout(() => setUiActions(prev => [...prev, ...data.actions]), 350)
              } else {
                setUiActions(prev => [...prev, ...data.actions])
              }
            } else {
              speakBangla("আমি বুঝতে পারিনি, আবার বলুন।");
            }
          } catch (err) {
            speakBangla("সার্ভারে সমস্যা হচ্ছে, একটু পর চেষ্টা করুন।");
          } finally {
            setAgentBusy(false)
          }
        })();
        
        return ""
      })
    }

    // Decide current state
    const state: "listening" | "processing" | "speaking" | "idle" =
      voiceListening
        ? "listening"
        : agentBusy
        ? "processing"
        : speaking
        ? "speaking"
        : "idle"

    const cfg = {
      listening: {
        label: "শুনছি…",
        sub: "কথা বলুন",
        cls: "vsb-listening",
        icon: "mic",
      },
      processing: {
        label: "AI ভাবছে…",
        sub: "একটু অপেক্ষা করুন",
        cls: "vsb-processing",
        icon: "spark",
      },
      speaking: {
        label: "AI বলছে…",
        sub: "উত্তর দিচ্ছে",
        cls: "vsb-speaking",
        icon: "volume",
      },
      idle: {
        label: "প্রস্তুত",
        sub: "বলুন বা টাইপ করুন",
        cls: "vsb-idle",
        icon: "mic",
      },
    }[state]

    return (
      <div className={`voice-status-badge ${cfg.cls}`} aria-live="polite" aria-label={`ভয়েস অবস্থা: ${cfg.label}`}>
        {/* Animated indicator */}
        <div className="vsb-indicator">
          {state === "listening" && (
            <div className="vsb-waves">
              <i /><i /><i /><i /><i />
            </div>
          )}
          {state === "processing" && (
            <div className="vsb-spinner" />
          )}
          {state === "speaking" && (
            <div className="vsb-bars">
              <i /><i /><i /><i />
            </div>
          )}
          {state === "idle" && (
            <span className="vsb-dot" />
          )}
        </div>
        {/* Text */}
        <div className="vsb-text">
          <strong>{cfg.label}</strong>
          <small>{cfg.sub}</small>
        </div>
        
        <div style={{ marginLeft: 15, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <label style={{ fontSize: 10, color: 'var(--color-primary)' }}>
                <input type="radio" name="vamode" checked={agentMode === "qa"} onChange={() => setAgentMode("qa")} style={{ marginRight: 4 }} />
                Q&A
            </label>
            <label style={{ fontSize: 10, color: 'var(--color-primary)' }}>
                <input type="radio" name="vamode" checked={agentMode === "ui_operator"} onChange={() => setAgentMode("ui_operator")} style={{ marginRight: 4 }} />
                Agent
            </label>
        </div>

        {/* Mic / Send icon */}
        <button
          className="vsb-mic-hint"
          onClick={() => {
            if (state === "idle") {
              startListening()
            } else if (state === "listening") {
              stopAndSend()
            }
          }}
          aria-label={state === "listening" ? "কথা শেষ করে পাঠান" : "ভয়েস ইনপুট শুরু করুন"}
          style={{ 
            marginLeft: '10px',
            background: state === 'listening' ? 'var(--color-primary)' : 'transparent',
            color: state === 'listening' ? 'white' : 'inherit',
            border: state === 'listening' ? 'none' : '1px solid rgba(255,255,255,0.2)',
            borderRadius: '50%',
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer'
          }}
        >
          <Icon name={state === "listening" ? "arrow" : "mic"} size={16} />
        </button>
      </div>
    )
  }

  function Splash() {
    return (
      <div className="auth-screen splash-screen">
        <div className="auth-top">
          <span className="auth-brand-small">
            sohoj<span>pay</span>
          </span>
          <LanguageButton small />
        </div>
        <div className="splash-center">
          <Logo size={150} circle />
          <h1>
            sohoj<span>pay</span>
          </h1>
          <p>
            {t(
              "Money made simple. Life made easier.",
              "সহজ লেনদেনে, সহজ জীবন।",
            )}
          </p>
        </div>
        <div className="splash-bottom">
          <button className="primary-button" onClick={() => navigate("login")}>
            {t("Get started", "শুরু করুন")} <Icon name="arrow" size={20} />
          </button>
          <span>
            {t("Your everyday money companion", "আপনার প্রতিদিনের টাকার সঙ্গী")}
          </span>
        </div>
      </div>
    )
  }

  function Login() {
    return (
      <div className="auth-screen login-screen">
        <div className="auth-top">
          <button className="auth-brand" onClick={() => navigate("splash")}>
            <Logo size={39} />
            <span>
              sohoj<span>pay</span>
            </span>
          </button>
          <LanguageButton small />
        </div>
        <div className="login-content">
          <div className="login-greeting">
            <span className="eyebrow blue-eyebrow">
              {t("WELCOME BACK", "আবারও স্বাগতম")}
            </span>
            <h1>{t("Good to see you again, Raihan.", "আবার দেখা হলো, রায়হান।")}</h1>
            <p>
              {t(
                "Enter your 4-digit PIN to get back to what matters.",
                "এগিয়ে যেতে আপনার ৪ সংখ্যার পিন লিখুন।",
              )}
            </p>
          </div>
          <div className="pin-box">
            <label>
              {t("Enter your 4-digit PIN", "আপনার ৪ সংখ্যার পিন লিখুন")}
            </label>
            <div className="pin-entry">
              <div className="pin-dots">
                {[0, 1, 2, 3].map((i) => (
                  <span className={pin.length > i ? "filled" : ""} key={i} />
                ))}
              </div>
              <button
                className="pin-submit"
                onClick={pinLogin}
                aria-label="Log in"
              >
                <Icon name="arrow" size={24} />
              </button>
            </div>
            <div className="login-links">
              <button
                onClick={() => {
                  setToast("Biometric sign-in is a demo feature.")
                }}
              >
                <Icon name="fingerprint" size={23} />
                {t("Face ID / Fingerprint", "ফেস আইডি / ফিঙ্গারপ্রিন্ট")}
              </button>
              <button onClick={() => setModal("Forgot PIN")}>
                {t("Forgot PIN?", "পিন ভুলে গেছেন?")}
              </button>
            </div>
          </div>
          <div className="keypad">
            {[
              "1",
              "2",
              "3",
              "4",
              "5",
              "6",
              "7",
              "8",
              "9",
              "",
              "0",
              "delete",
            ].map((key, index) =>
              key === "" ? (
                <span key={index} />
              ) : (
                <button
                  key={index}
                  onClick={() =>
                    setPin(
                      key === "delete"
                        ? pin.slice(0, -1)
                        : (pin + key).slice(0, 4),
                    )
                  }
                  aria-label={key === "delete" ? "Delete digit" : key}
                >
                  {key === "delete" ? <Icon name="backspace" size={24} /> : key}
                </button>
              ),
            )}
          </div>
          <p className="login-secure">
            <Icon name="lock" size={14} />
            {t("Your money is safe with us", "আপনার টাকা আমাদের কাছে নিরাপদ")}
          </p>
        </div>
      </div>
    )
  }

  const nav = [
    { key: "home", label: t("Home", "হোম"), icon: "home" },
    { key: "account", label: t("Account", "অ্যাকাউন্ট"), icon: "user" },
    { key: "history", label: t("History", "ইতিহাস"), icon: "history" },
    { key: "more", label: t("More", "আরও"), icon: "more" },
  ] as const
  const isAuth = page === "splash" || page === "login" || page === "admin"

  if (authLoading) {
    return <div className="app-loading"><Logo size={72} /><span>sohoj<b>pay</b></span><i /></div>
  }

  return (
    <div className={`app-shell ${isAuth ? "auth-shell" : ""} ${voiceMode && !isAuth ? "voice-mode-active" : ""}`}>
      {!isAuth && (
        <aside className="sidebar">
          <button className="sidebar-brand" onClick={() => navigate("home")}>
            <Logo size={42} />
            <span>
              sohoj<span>pay</span>
            </span>
          </button>
          <div className="sidebar-caption">
            {t("YOUR EVERYDAY WALLET", "আপনার প্রতিদিনের ওয়ালেট")}
          </div>
          <nav aria-label="Main navigation">
            {nav.map((item) => (
              <button
                key={item.key}
                onClick={() => navigate(item.key)}
                className={page === item.key ? "active" : ""}
              >
                <Icon name={item.icon} size={22} />
                <span>{item.label}</span>
                {page === item.key && <i />}
              </button>
            ))}
          </nav>
          <button className="sidebar-scan" onClick={() => setModal("Scan QR")}>
            <Icon name="scan" size={22} />
            <span>{t("Scan QR code", "কিউআর স্ক্যান")}</span>
            <Icon name="arrow" size={18} />
          </button>
          <div className="sidebar-bottom">
            <div className="sidebar-help">
              <span>
                <Icon name="headset" size={20} />
              </span>
              <div>
                <strong>{t("Need a hand?", "সাহায্য দরকার?")}</strong>
                <small>{t("We're always here.", "আমরা সবসময় আছি।")}</small>
              </div>
              <button
                onClick={() => setModal("24/7 Service")}
                aria-label="Get support"
              >
                <Icon name="arrow" size={17} />
              </button>
            </div>
            <button
              className="sidebar-profile"
              onClick={() => navigate("account")}
            >
              <img src={photo} alt="" />
              <span>
                <strong>Raihan Ahmed</strong>
                <small>{t("Personal account", "ব্যক্তিগত অ্যাকাউন্ট")}</small>
              </span>
              <Icon name="chevron" size={17} />
            </button>
          </div>
        </aside>
      )}
      <main className="main-area">
        {!isAuth && (
          <div className="desktop-topbar">
            <div className="breadcrumb">
              {t("Overview", "ওভারভিউ")} <Icon name="chevron" size={14} />
              <strong>{nav.find((item) => item.key === page)?.label}</strong>
            </div>
            <div className="topbar-actions">
              <span className="topbar-date">
                {t("Wednesday, 21 May 2025", "বুধবার, ২১ মে ২০২৫")}
              </span>
              <VoiceModeToggle />
              <LanguageButton />
              <button
                className="topbar-bell"
                onClick={() => setModal("Notifications")}
                aria-label="Notifications"
              >
                <Icon name="bell" size={20} />
                <i />
              </button>
              <img src={photo} alt="Raihan Ahmed" />
            </div>
          </div>
        )}
        {!isAuth && (
          <div className="mobile-voice-bar">
            <VoiceModeToggle />
          </div>
        )}
        <div className="main-inner">
          {page === "home" ? (<Home />
          ) : page === "account" ? (<Account />
          ) : page === "add-contact" ? (<AddContactPage onBack={() => navigate("home")} />
          ) : page === "history" ? (<History />
          ) : page === "more" ? (<More />
          ) : page === "splash" ? (<Splash />
          ) : page === "admin" ? (<AdminPanel />
          ) : page === "cashout" ? (<CashOutPage onBack={() => navigate("home")} />
          ) : page === "send-money" ? (<SendMoneyPage onBack={() => navigate("home")} />
          ) : page === "recharge" ? (<RechargePage onBack={() => navigate("home")} />
          ) : page === "pay-bill" ? (<PayBillPage onBack={() => navigate("home")} />
          ) : page === "add-money" ? (<AddMoneyPage onBack={() => navigate("home")} />
          ) : page === "savings" ? (<SavingsPage onBack={() => navigate("home")} />
          ) : page === "fund-transfer" ? (<FundTransferPage onBack={() => navigate("home")} />
          ) : page === "request-money" ? (<RequestMoneyPage onBack={() => navigate("home")} />
          ) : page === "make-payment" ? (<MakePaymentPage onBack={() => navigate("home")} />
          ) : page === "refer-earn" ? (<ReferEarnPage onBack={() => navigate("home")} />
          ) : page === "npsb" ? (<NPSBPage onBack={() => navigate("home")} />
          ) : (<AuthLogin />)}
        </div>
      </main>
      {!isAuth && (
        <nav className="mobile-nav" aria-label="Bottom navigation">
          <button
            onClick={() => navigate("home")}
            className={page === "home" ? "active" : ""}
          >
            <Icon name="home" size={23} />
            <span>{t("Home", "হোম")}</span>
          </button>
          <button
            onClick={() => navigate("account")}
            className={page === "account" ? "active" : ""}
          >
            <Icon name="user" size={23} />
            <span>{t("Account", "অ্যাকাউন্ট")}</span>
          </button>
          <button
            className="mobile-scan"
            onClick={() => setModal("Scan QR")}
            aria-label="Scan QR code"
          >
            <Icon name="scan" size={28} />
          </button>
          <button
            onClick={() => navigate("history")}
            className={page === "history" ? "active" : ""}
          >
            <Icon name="history" size={23} />
            <span>{t("History", "ইতিহাস")}</span>
          </button>
          <button
            onClick={() => navigate("more")}
            className={page === "more" ? "active" : ""}
          >
            <Icon name="more" size={23} />
            <span>{t("More", "আরও")}</span>
          </button>
        </nav>
      )}
      {!isAuth && !voiceMode && currentUser?.role === "user" && aiEnabledGlobally && AgentChat()}
      {!isAuth && voiceMode && aiEnabledGlobally && <VoiceStatusBadge />}
      {modal && (
        <div className="modal-backdrop" onMouseDown={() => setModal(null)}>
          <div
            className="modal-card"
            role="dialog"
            aria-modal="true"
            aria-label={modal}
            onMouseDown={(event) => event.stopPropagation()}
          >
            <button
              className="modal-close"
              onClick={() => setModal(null)}
              aria-label="Close"
            >
              <Icon name="close" size={20} />
            </button>
            <div className="modal-icon">
              <Icon
                name={
                  modal === "Scan QR"
                    ? "scan"
                    : modal === "Notifications"
                      ? "bell"
                      : "spark"
                }
                size={32}
              />
            </div>
            <h2>{modal}</h2>
            {modal === "Scan QR" ? (
              <>
                <p>Scan a merchant QR code to pay quickly and securely.</p>
                <div className="qr-placeholder">
                  <Icon name="scan" size={88} strokeWidth={1.1} />
                  <span>Camera preview</span>
                </div>
              </>
            ) : modal === "Notifications" ? (
              <p>You’re all caught up! New updates will appear here.</p>
            ) : (
              <p>
                This is a preview of the {modal.toLowerCase()} experience. Your
                Sohoj Pay services are right at your fingertips.
              </p>
            )}
            <button className="modal-action" onClick={() => setModal(null)}>
              Got it <Icon name="arrow" size={17} />
            </button>
          </div>
        </div>
      )}
      {toast && (
        <div className="toast" role="status">
          <Icon name="check" size={18} />
          {toast}
        </div>
      )}
    </div>
  )
}

export default App
