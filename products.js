window.__v = window.__v || {}; window.__v.products = "R6"; // رقم الإصدار (لا تغيّره، عدّل الأسعار أدناه فقط)
// صور المنتجات من ملف images.js (إن لم يُوجد الملف تُرسم قطع أثاث بديلة تلقائياً)
const IMG = window.IMG || {};

// ============ إعدادات المتجر ============
window.SHOP_CONFIG = {
  storeName: "Mini touch",    // اسم المتجر (يظهر إذا لم توجد صورة شعار)
  logoImage: IMG.logo,        // صورة الشعار العرضية (موجودة في images.js باسم logo)
  whatsapp: "963992147669",   // رقم الواتس اب (بدون + أو أصفار)
  currency: "ل.س",            // رمز العملة
  qrUrl: "",                  // رابط رمز QR. اتركه فارغاً ليُولَّد الرمز تلقائياً من عنوان موقعك، أو اكتب رابطاً مثل "https://موقعك.com"
  qrImage: "",                // اختياري: صورة QR جاهزة (مسار أو base64) تحل مكان الرمز المولَّد
  supportLabel: "الدعم الفني :",       // الجملة التي تظهر تحت الرمز
  supportPhone: "+٩٦٣ ٩٩٢ ١٤٧ ٦٦٩"     // رقم الدعم الفني تحت الرمز
};

// ============ الصورة العلوية (البانر) ============
// heroImage: صورة الشريحة (من IMG أو مسار أو base64). إذا تركتها "" تُرسم قطعة أثاث حسب heroType.
// colors: لونا خلفية الشريحة.   أضف أكثر من شريحة لتتبدل تلقائياً.
window.HERO_SLIDES = [
  {
    image: "",
    colors: ["#b88650", "#6b4226"],
    heroImage: IMG.sofaCream,
    heroType: "sofa", heroColor: "#9db4a4",
    title: "أثاث يمنح بيتك دفئاً",
    subtitle: "تصاميم عصرية بلمسة خشبية أنيقة"
  },
  {
    image: "",
    colors: ["#c9a27a", "#8a5a35"],
    heroImage: IMG.diningMarble,
    heroType: "dining", heroColor: "#e0a98f",
    title: "طاولات طعام فاخرة",
    subtitle: "رخام وخشب بتفاصيل تدوم"
  }
];
window.HERO_INTERVAL = 4000; // مدة التبديل بالمللي ثانية

// ============ المنتجات ============
// image: صورة المنتج (IMG.اسم أو مسار أو base64).  category: التصنيف.
// type/color: يُستعملان للرسم البديل فقط إذا لم توجد صورة.   الأسعار أدناه أمثلة، عدّلها.
window.PRODUCTS = [
  { id: 1,  name: "كنبة زاوية كريمي",             price: 6500000, category: "جلوس",          image: IMG.sofaCream,   type: "sofa",     color: "#e9dcc6" },
  { id: 2,  name: "كنبة زاوية بصندوق تخزين",       price: 5200000, category: "جلوس",          image: IMG.sofaStorage, type: "sofa",     color: "#b98b5a" },
  { id: 3,  name: "طقم كنب قطيفة رمادي",           price: 7800000, category: "جلوس",          image: IMG.sofaVelvet,  type: "armchair", color: "#7f9a98" },
  { id: 4,  name: "كنبة مزدوجة بأرجل خشبية",       price: 3400000, category: "جلوس",          image: IMG.sofaTwo,     type: "sofa",     color: "#cfcac0" },
  { id: 5,  name: "كنبة كريمي بتفاصيل خشبية",      price: 3900000, category: "جلوس",          image: IMG.sofaWood,    type: "sofa",     color: "#eadfc8" },
  { id: 6,  name: "طاولة طعام رخام مع ٦ كراسي",    price: 5800000, category: "طعام",          image: IMG.diningMarble,type: "dining",   color: "#e0a98f" },
  { id: 7,  name: "طاولة طعام زجاج مع ٦ كراسي",    price: 5400000, category: "طعام",          image: IMG.diningGlass, type: "dining",   color: "#b9a38a" },
  { id: 8,  name: "طقم طاولات وسط بسطح زجاجي",     price: 1600000, category: "طاولات وكراسي", image: IMG.coffeeSet,   type: "coffee",   color: "#c9a27a" },
  { id: 9,  name: "كرسي فرو بإطار خشبي",           price: 650000,  category: "طاولات وكراسي", image: IMG.chairFur,    type: "chair",    color: "#9aa0a6" },
  { id: 10, name: "كرسيان مع طاولة جانبية",        price: 1450000, category: "طاولات وكراسي", image: IMG.chairsTable, type: "chair",    color: "#e6d8bf" }
];
