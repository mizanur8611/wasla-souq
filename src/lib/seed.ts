import { findOrCreateCity, createPartner, seedDemoCustomerIfMissing, listApprovedPartners, createUser, getUserByEmail, ensureRiderProfile } from "./db";
import { hashPassword } from "./auth-node";

interface MenuItem { category: string; name: string; nameAr: string; description: string; price: number; }
interface RestaurantSeed { name: string; nameAr: string; cuisineTag: string; heroEmoji: string; ratingAvg: number; etaMinsLow: number; etaMinsHigh: number; lat?: number; lng?: number; items: MenuItem[]; }

async function seedCity(cityName: string, country: string, currency: string, partners: RestaurantSeed[]) {
  const city = await findOrCreateCity(cityName, country, currency);
  await seedDemoCustomerIfMissing(city.id);
  const existing = await listApprovedPartners(cityName);
  if (existing.length > 0) {
    console.log(`${cityName}: already seeded (${existing.length} partners), skipping.`);
    return { city, partners: existing };
  }
  const created = [];
  for (const p of partners) {
    const partner = await createPartner({ ...p, cityId: city.id });
    created.push(partner);
  }
  console.log(`Seeded ${cityName}: ${created.length} restaurants.`);
  return { city, partners: created };
}

async function main() {
  console.log("Seeding Wasla Souq demo data (multi-city Phase 2)...");

  // ── UAE / Dubai ──────────────────────────────────────────────
  const { city: dubai, partners: dubaiPartners } = await seedCity("Dubai", "United Arab Emirates", "AED", [
    {
      name: "Manqal Grill House", nameAr: "بيت منقل الشواء", cuisineTag: "Mixed grill · Levantine",
      heroEmoji: "🍢", ratingAvg: 4.8, etaMinsLow: 22, etaMinsHigh: 32, lat: 25.0805, lng: 55.1403,
      items: [
        { category: "mains", name: "Mixed Grill Platter", nameAr: "مشاوي مشكلة", description: "Chicken, lamb & kofta, grilled rice", price: 38 },
        { category: "mains", name: "Shish Tawook", nameAr: "شيش طاووق", description: "Marinated chicken skewers", price: 24 },
        { category: "sides", name: "Fattoush Salad", nameAr: "فتوش", description: "Crispy pita, sumac, pomegranate", price: 14 },
        { category: "sides", name: "Garlic Toum", nameAr: "ثوم", description: "Lebanese garlic sauce", price: 5 },
      ],
    },
    {
      name: "Saffron & Sumac", nameAr: "زعفران وسماق", cuisineTag: "Mandi · Biryani · Kabsa",
      heroEmoji: "🍛", ratingAvg: 4.9, etaMinsLow: 28, etaMinsHigh: 38, lat: 25.0763, lng: 55.1339,
      items: [
        { category: "mains", name: "Chicken Mandi", nameAr: "مندي دجاج", description: "Slow-roasted chicken, spiced rice", price: 32 },
        { category: "mains", name: "Lamb Kabsa", nameAr: "كبسة لحم", description: "Spiced rice with tender lamb", price: 42 },
        { category: "mains", name: "Vegetable Biryani", nameAr: "برياني خضار", description: "Fragrant rice, mixed vegetables", price: 22 },
        { category: "mains", name: "Lamb Ouzi", nameAr: "أوزي لحم", description: "Whole roasted lamb on rice", price: 45 },
      ],
    },
    {
      name: "Karak Corner", nameAr: "زاوية الكرك", cuisineTag: "Karak tea · Breakfast",
      heroEmoji: "☕", ratingAvg: 4.7, etaMinsLow: 15, etaMinsHigh: 20, lat: 25.0890, lng: 55.1478,
      items: [
        { category: "drinks", name: "Karak Chai", nameAr: "كرك", description: "Spiced milk tea", price: 6 },
        { category: "mains", name: "Chicken Paratha Roll", nameAr: "رول فراطة دجاج", description: "Spiced chicken, flaky paratha", price: 16 },
        { category: "mains", name: "Cheese Manousheh", nameAr: "منقوشة جبنة", description: "Baked flatbread with cheese", price: 12 },
      ],
    },
    {
      name: "Bait Al Shawarma", nameAr: "بيت الشاورما", cuisineTag: "Shawarma · Fries · Juices",
      heroEmoji: "🥙", ratingAvg: 4.6, etaMinsLow: 18, etaMinsHigh: 26, lat: 25.0717, lng: 55.1281,
      items: [
        { category: "mains", name: "Chicken Shawarma Wrap", nameAr: "شاورما دجاج", description: "Garlic sauce, pickles", price: 13 },
        { category: "mains", name: "Beef Shawarma Plate", nameAr: "صحن شاورما لحم", description: "With rice and salad", price: 26 },
        { category: "sides", name: "Loaded Fries", nameAr: "بطاطا مشكلة", description: "Cheese, garlic sauce, parsley", price: 15 },
        { category: "drinks", name: "Fresh Lemon & Mint", nameAr: "ليمون نعناع", description: "Freshly squeezed", price: 9 },
      ],
    },
  ]);

  // ── Saudi Arabia / Riyadh ────────────────────────────────────
  await seedCity("Riyadh", "Saudi Arabia", "SAR", [
    {
      name: "Najd Village", nameAr: "قرية نجد", cuisineTag: "Saudi · Kabsa · Jareesh",
      heroEmoji: "🍚", ratingAvg: 4.9, etaMinsLow: 25, etaMinsHigh: 40, lat: 24.7136, lng: 46.6753,
      items: [
        { category: "mains", name: "Lamb Kabsa", nameAr: "كبسة لحم", description: "Slow-cooked lamb, basmati, dried fruits", price: 55 },
        { category: "mains", name: "Jareesh", nameAr: "جريش", description: "Cracked wheat with lamb", price: 35 },
        { category: "mains", name: "Margoog", nameAr: "مرقوق", description: "Meat & vegetable bread stew", price: 42 },
        { category: "sides", name: "Dates & Ghee", nameAr: "تمر وسمن", description: "Medjool dates with clarified butter", price: 18 },
      ],
    },
    {
      name: "Al Romansiah", nameAr: "الرومانسية", cuisineTag: "Grills · Shawarma · Mandi",
      heroEmoji: "🔥", ratingAvg: 4.7, etaMinsLow: 20, etaMinsHigh: 35, lat: 24.6877, lng: 46.7219,
      items: [
        { category: "mains", name: "Chicken Mandi", nameAr: "مندي دجاج", description: "Riyadh-style slow-roasted chicken", price: 38 },
        { category: "mains", name: "Mixed Tikka", nameAr: "تيكا مشكلة", description: "Marinated chicken & beef", price: 49 },
        { category: "sides", name: "Tabbouleh", nameAr: "تبولة", description: "Fresh parsley, tomato, bulgur", price: 16 },
        { category: "drinks", name: "Saudi Qahwa", nameAr: "قهوة سعودية", description: "Cardamom coffee with dates", price: 12 },
      ],
    },
    {
      name: "Maestro Pizza Riyadh", nameAr: "مايسترو بيتزا الرياض", cuisineTag: "Pizza · Pasta · Sandwiches",
      heroEmoji: "🍕", ratingAvg: 4.5, etaMinsLow: 30, etaMinsHigh: 45, lat: 24.7535, lng: 46.6380,
      items: [
        { category: "mains", name: "Zaatar & Cheese Pizza", nameAr: "بيتزا زعتر وجبن", description: "Thyme, mozzarella, olive oil", price: 45 },
        { category: "mains", name: "BBQ Chicken Pizza", nameAr: "بيتزا دجاج باربيكيو", description: "Smoked chicken, peppers, BBQ", price: 52 },
        { category: "sides", name: "Garlic Bread", nameAr: "خبز بالثوم", description: "Crispy baguette, garlic butter", price: 18 },
      ],
    },
  ]);

  // ── Kuwait / Kuwait City ─────────────────────────────────────
  await seedCity("Kuwait City", "Kuwait", "KWD", [
    {
      name: "Freej Swaileh", nameAr: "فريج صويلح", cuisineTag: "Kuwaiti · Traditional",
      heroEmoji: "🫕", ratingAvg: 4.9, etaMinsLow: 30, etaMinsHigh: 45, lat: 29.3697, lng: 47.9783,
      items: [
        { category: "mains", name: "Machboos Laham", nameAr: "مجبوس لحم", description: "Kuwaiti spiced rice with lamb", price: 4.5 },
        { category: "mains", name: "Harees", nameAr: "هريس", description: "Wheat & lamb slow porridge", price: 3.2 },
        { category: "mains", name: "Muhammar", nameAr: "محمر", description: "Sweet brown rice with saffron", price: 2.8 },
        { category: "sides", name: "Salona Samak", nameAr: "صالونة سمك", description: "Spiced fish stew", price: 3.5 },
      ],
    },
    {
      name: "Slider Station Kuwait", nameAr: "سليدر ستيشن الكويت", cuisineTag: "Burgers · Sliders · Fries",
      heroEmoji: "🍔", ratingAvg: 4.6, etaMinsLow: 20, etaMinsHigh: 35, lat: 29.3759, lng: 47.9901,
      items: [
        { category: "mains", name: "Classic Beef Slider ×3", nameAr: "سليدر لحم ×3", description: "Pickles, American cheese, special sauce", price: 3.8 },
        { category: "mains", name: "Spicy Chicken Sandwich", nameAr: "ساندويش دجاج حار", description: "Crispy chicken, jalapeño slaw", price: 2.9 },
        { category: "sides", name: "Truffle Fries", nameAr: "بطاطا ترافل", description: "Parmesan, truffle oil", price: 1.8 },
      ],
    },
  ]);

  // ── Qatar / Doha ─────────────────────────────────────────────
  await seedCity("Doha", "Qatar", "QAR", [
    {
      name: "Parisa Doha", nameAr: "باريسا الدوحة", cuisineTag: "Iranian · Persian · Grills",
      heroEmoji: "🧆", ratingAvg: 4.8, etaMinsLow: 25, etaMinsHigh: 40, lat: 25.2854, lng: 51.5310,
      items: [
        { category: "mains", name: "Koobideh Kebab", nameAr: "كباب كوبيده", description: "Minced lamb & beef skewer", price: 52 },
        { category: "mains", name: "Ghormeh Sabzi", nameAr: "قورمه سبزي", description: "Persian herb stew with lamb", price: 58 },
        { category: "mains", name: "Chelo Rice", nameAr: "أرز تشيلو", description: "Saffron-crusted basmati", price: 22 },
        { category: "drinks", name: "Doogh", nameAr: "دوغ", description: "Yoghurt mint sparkling drink", price: 14 },
      ],
    },
    {
      name: "Operation Falafel Doha", nameAr: "عملية فلافل الدوحة", cuisineTag: "Falafel · Wraps · Levantine",
      heroEmoji: "🧇", ratingAvg: 4.7, etaMinsLow: 15, etaMinsHigh: 25, lat: 25.2942, lng: 51.5228,
      items: [
        { category: "mains", name: "Falafel Wrap", nameAr: "رول فلافل", description: "Tahini, pickles, fresh vegetables", price: 28 },
        { category: "mains", name: "Hummus Plate", nameAr: "طبق حمص", description: "Chunky chickpea, olive oil, paprika", price: 22 },
        { category: "sides", name: "Cheese Sambousek ×4", nameAr: "سمبوسك جبنة ×4", description: "Crispy pastry, akkawi cheese", price: 18 },
      ],
    },
  ]);

  // ── Jordan / Amman ───────────────────────────────────────────
  await seedCity("Amman", "Jordan", "JOD", [
    {
      name: "Hashem Restaurant", nameAr: "مطعم هاشم", cuisineTag: "Jordanian · Foul · Falafel",
      heroEmoji: "🫘", ratingAvg: 5.0, etaMinsLow: 15, etaMinsHigh: 25, lat: 31.9554, lng: 35.9234,
      items: [
        { category: "mains", name: "Foul & Falafel Plate", nameAr: "طبق فول وفلافل", description: "Amman's most iconic breakfast", price: 1.8 },
        { category: "mains", name: "Mansaf Bowl", nameAr: "وعاء منسف", description: "Lamb in jameed yoghurt sauce, rice", price: 4.5 },
        { category: "sides", name: "Ka'ak Bread", nameAr: "خبز كعك", description: "Sesame-crusted Jordanian ring bread", price: 0.5 },
        { category: "drinks", name: "Sahlab", nameAr: "سحلب", description: "Warm orchid milk, cinnamon, nuts", price: 1.2 },
      ],
    },
    {
      name: "Books@Cafe Amman", nameAr: "بوكس كافيه عمّان", cuisineTag: "Café · Fusion · Brunch",
      heroEmoji: "📚", ratingAvg: 4.6, etaMinsLow: 20, etaMinsHigh: 35, lat: 31.9843, lng: 35.8877,
      items: [
        { category: "mains", name: "Eggs Benedict", nameAr: "بيض بنديكت", description: "Poached eggs, hollandaise, sourdough", price: 5.5 },
        { category: "mains", name: "Shakshuka", nameAr: "شكشوكة", description: "Eggs in spiced tomato sauce", price: 4.2 },
        { category: "drinks", name: "Cardamom Latte", nameAr: "لاتيه هيل", description: "Espresso, steamed milk, cardamom", price: 2.8 },
      ],
    },
  ]);

  // ── Bahrain / Manama ─────────────────────────────────────────
  await seedCity("Manama", "Bahrain", "BHD", [
    {
      name: "Saffron by Jena", nameAr: "زعفران من جنى", cuisineTag: "Bahraini · Gulf · Grills",
      heroEmoji: "🌺", ratingAvg: 4.8, etaMinsLow: 25, etaMinsHigh: 40, lat: 26.2235, lng: 50.5876,
      items: [
        { category: "mains", name: "Muhammar with Fish", nameAr: "محمر مع سمك", description: "Sweet Bahraini rice with grilled hamour", price: 4.8 },
        { category: "mains", name: "Lamb Machboos", nameAr: "مجبوس لحم", description: "Gulf-spiced slow-cooked lamb", price: 5.5 },
        { category: "sides", name: "Balaleet", nameAr: "بلاليط", description: "Sweet vermicelli with saffron & eggs", price: 2.0 },
        { category: "drinks", name: "Laban Up", nameAr: "لبن آب", description: "Cold buttermilk drink", price: 0.8 },
      ],
    },
    {
      name: "The Meat Company Bahrain", nameAr: "شركة اللحم البحرين", cuisineTag: "Steakhouse · Burgers",
      heroEmoji: "🥩", ratingAvg: 4.7, etaMinsLow: 30, etaMinsHigh: 45, lat: 26.2136, lng: 50.5971,
      items: [
        { category: "mains", name: "Wagyu Ribeye 300g", nameAr: "واغيو ريب آي 300 غ", description: "Grain-fed, cooked to order", price: 18.0 },
        { category: "mains", name: "Classic Cheeseburger", nameAr: "تشيز برغر كلاسيك", description: "Brioche bun, beef patty, cheddar", price: 6.5 },
        { category: "sides", name: "Mac & Cheese", nameAr: "مكرونة بالجبن", description: "Baked, four-cheese blend", price: 3.2 },
      ],
    },
  ]);

  // ── Oman / Muscat ────────────────────────────────────────────
  await seedCity("Muscat", "Oman", "OMR", [
    {
      name: "Bait Al Luban", nameAr: "بيت اللبان", cuisineTag: "Omani · Traditional · Seafood",
      heroEmoji: "🌊", ratingAvg: 4.9, etaMinsLow: 30, etaMinsHigh: 45, lat: 23.5880, lng: 58.3829,
      items: [
        { category: "mains", name: "Shuwa Lamb", nameAr: "شواء لحم", description: "Underground pit-roasted lamb, Omani spices", price: 6.5 },
        { category: "mains", name: "Mashuai", nameAr: "مشوي", description: "Grilled kingfish with lemon rice", price: 5.8 },
        { category: "mains", name: "Harees", nameAr: "هريس", description: "Slow-cooked wheat & lamb", price: 3.5 },
        { category: "drinks", name: "Omani Qahwa", nameAr: "قهوة عُمانية", description: "Rose water, cardamom, saffron coffee", price: 1.2 },
      ],
    },
    {
      name: "Ubhar Restaurant", nameAr: "مطعم عبهر", cuisineTag: "Omani · Modern · Fusion",
      heroEmoji: "🏔️", ratingAvg: 4.7, etaMinsLow: 25, etaMinsHigh: 40, lat: 23.5957, lng: 58.3936,
      items: [
        { category: "mains", name: "Omani Biryani", nameAr: "برياني عُماني", description: "Goat meat, fried onion, Omani loomi", price: 4.2 },
        { category: "mains", name: "Grilled Lobster", nameAr: "لوبستر مشوي", description: "Muscat Bay lobster, garlic butter", price: 9.5 },
        { category: "sides", name: "Khubz Ragag", nameAr: "خبز رقاق", description: "Crispy Omani wafer bread", price: 1.0 },
      ],
    },
  ]);

  // ── Egypt / Cairo ────────────────────────────────────────────
  await seedCity("Cairo", "Egypt", "EGP", [
    {
      name: "Koshary El Tahrir", nameAr: "كشري التحرير", cuisineTag: "Egyptian · Koshary · Street food",
      heroEmoji: "🍝", ratingAvg: 4.8, etaMinsLow: 15, etaMinsHigh: 25, lat: 30.0444, lng: 31.2357,
      items: [
        { category: "mains", name: "Koshary Bowl (Large)", nameAr: "وعاء كشري (كبير)", description: "Rice, lentils, pasta, tomato sauce, crispy onions", price: 45 },
        { category: "mains", name: "Koshary Bowl (Small)", nameAr: "وعاء كشري (صغير)", description: "Classic street-food serving", price: 30 },
        { category: "sides", name: "Extra Dakka Sauce", nameAr: "صوص دقة إضافي", description: "Spicy tomato & vinegar", price: 10 },
        { category: "drinks", name: "Sugarcane Juice", nameAr: "عصير قصب", description: "Freshly pressed", price: 25 },
      ],
    },
    {
      name: "Felfela Cairo", nameAr: "فلفلة القاهرة", cuisineTag: "Egyptian · Mezze · Grills",
      heroEmoji: "🌶️", ratingAvg: 4.7, etaMinsLow: 25, etaMinsHigh: 40, lat: 30.0600, lng: 31.2422,
      items: [
        { category: "mains", name: "Hawawshi", nameAr: "حواوشي", description: "Spiced minced meat in crispy bread", price: 75 },
        { category: "mains", name: "Molokhia with Rabbit", nameAr: "ملوخية بالأرانب", description: "Jute leaf stew, Egyptian style", price: 120 },
        { category: "sides", name: "Baba Ganoush", nameAr: "بابا غنوج", description: "Roasted aubergine, tahini, lemon", price: 55 },
        { category: "drinks", name: "Tamarind Drink", nameAr: "تمر هندي", description: "Sweet & sour chilled tamarind", price: 30 },
      ],
    },
    {
      name: "Hardee's Cairo", nameAr: "هارديز القاهرة", cuisineTag: "Burgers · Chicken · Fast food",
      heroEmoji: "🍟", ratingAvg: 4.3, etaMinsLow: 20, etaMinsHigh: 30, lat: 30.0500, lng: 31.2300,
      items: [
        { category: "mains", name: "Thickburger", nameAr: "ثيك برغر", description: "Angus beef, lettuce, tomato, mayo", price: 145 },
        { category: "mains", name: "Crispy Chicken Sandwich", nameAr: "ساندويش دجاج كريسبي", description: "Buttermilk-fried chicken", price: 115 },
        { category: "sides", name: "Curly Fries", nameAr: "بطاطس كيرلي", description: "Seasoned spiral fries", price: 65 },
        { category: "drinks", name: "Mango Float", nameAr: "مانجو فلوت", description: "Mango juice with ice cream", price: 55 },
      ],
    },
  ]);

  // ── Demo user accounts ───────────────────────────────────────
  const allDubaiPartners = await listApprovedPartners("Dubai");
  const firstPartner = allDubaiPartners[0];

  if (firstPartner && !(await getUserByEmail("owner@manqal.com"))) {
    await createUser({
      email: "owner@manqal.com",
      passwordHash: await hashPassword("password123"),
      role: "restaurant_owner",
      name: "Manqal Grill House Owner",
      partnerId: firstPartner.id,
    });
    console.log("Seeded restaurant owner login: owner@manqal.com / password123");
  }

  if (!(await getUserByEmail("admin@waslasouq.com"))) {
    await createUser({
      email: "admin@waslasouq.com",
      passwordHash: await hashPassword("admin123"),
      role: "admin",
      name: "Wasla Souq Admin",
      partnerId: null,
    });
    console.log("Seeded admin login: admin@waslasouq.com / admin123");
  }

  if (!(await getUserByEmail("rider@waslasouq.com"))) {
    const rider = await createUser({
      email: "rider@waslasouq.com",
      passwordHash: await hashPassword("rider123"),
      role: "rider",
      name: "Yusuf K.",
      partnerId: null,
    });
    await ensureRiderProfile(rider!.id);
    console.log("Seeded rider login: rider@waslasouq.com / rider123");
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .then(() => process.exit(0));

  