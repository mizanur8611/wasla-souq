import { findOrCreateCity, createPartner, seedDemoCustomerIfMissing, listApprovedPartners, createUser, getUserByEmail } from "./db";
import { hashPassword } from "./auth-node";

async function main() {
  console.log("Seeding Wasla Souq demo data (Dubai · Food vertical)...");

  const dubai = await findOrCreateCity("Dubai", "United Arab Emirates", "AED");
  await seedDemoCustomerIfMissing(dubai.id);

  const existingPartners = await listApprovedPartners();
  let createdPartners: any[] = existingPartners;

  if (existingPartners.length > 0) {
    console.log("Partners already seeded — skipping restaurant/menu creation (TRUNCATE the tables in Postgres to reset).");
  } else {
    const partners = [
  {
    name: "Manqal Grill House",
    nameAr: "بيت منقل الشواء",
    cuisineTag: "Mixed grill · Levantine",
    heroEmoji: "🍢",
    ratingAvg: 4.8,
    etaMinsLow: 22,
    etaMinsHigh: 32,
    items: [
      { category: "mains", name: "Mixed Grill Platter", nameAr: "مشاوي مشكلة", description: "Chicken, lamb & kofta, grilled rice", price: 38 },
      { category: "mains", name: "Shish Tawook", nameAr: "شيش طاووق", description: "Marinated chicken skewers", price: 24 },
      { category: "sides", name: "Fattoush Salad", nameAr: "فتوش", description: "Crispy pita, sumac, pomegranate", price: 14 },
      { category: "sides", name: "Garlic Toum", nameAr: "ثوم", description: "Lebanese garlic sauce", price: 5 },
    ],
  },
  {
    name: "Saffron & Sumac",
    nameAr: "زعفران وسماق",
    cuisineTag: "Mandi · Biryani · Kabsa",
    heroEmoji: "🍛",
    ratingAvg: 4.9,
    etaMinsLow: 28,
    etaMinsHigh: 38,
    items: [
      { category: "mains", name: "Chicken Mandi", nameAr: "مندي دجاج", description: "Slow-roasted chicken, spiced rice", price: 32 },
      { category: "mains", name: "Lamb Kabsa", nameAr: "كبسة لحم", description: "Spiced rice with tender lamb", price: 42 },
      { category: "mains", name: "Vegetable Biryani", nameAr: "برياني خضار", description: "Fragrant rice, mixed vegetables", price: 22 },
    ],
  },
  {
    name: "Karak Corner",
    nameAr: "زاوية الكرك",
    cuisineTag: "Karak tea · Breakfast",
    heroEmoji: "☕",
    ratingAvg: 4.7,
    etaMinsLow: 15,
    etaMinsHigh: 20,
    items: [
      { category: "drinks", name: "Karak Chai", nameAr: "كرك", description: "Spiced milk tea", price: 6 },
      { category: "mains", name: "Chicken Paratha Roll", nameAr: "رول فراطة دجاج", description: "Spiced chicken, flaky paratha", price: 16 },
      { category: "mains", name: "Cheese Manousheh", nameAr: "منقوشة جبنة", description: "Baked flatbread with cheese", price: 12 },
    ],
  },
  {
    name: "Bait Al Shawarma",
    nameAr: "بيت الشاورما",
    cuisineTag: "Shawarma · Fries · Juices",
    heroEmoji: "🥙",
    ratingAvg: 4.6,
    etaMinsLow: 18,
    etaMinsHigh: 26,
    items: [
      { category: "mains", name: "Chicken Shawarma Wrap", nameAr: "شاورما دجاج", description: "Garlic sauce, pickles", price: 13 },
      { category: "mains", name: "Beef Shawarma Plate", nameAr: "صحن شاورما لحم", description: "With rice and salad", price: 26 },
      { category: "sides", name: "Loaded Fries", nameAr: "بطاطا مشكلة", description: "Cheese, garlic sauce, parsley", price: 15 },
      { category: "drinks", name: "Fresh Lemon & Mint", nameAr: "ليمون نعناع", description: "Freshly squeezed", price: 9 },
    ],
  },
  ];

    const newlyCreated = [];
    for (const p of partners) {
      const partner = await createPartner({ ...p, cityId: dubai.id });
      newlyCreated.push(partner);
    }
    createdPartners = newlyCreated;

    console.log(`Seeded city: ${dubai.name}, ${partners.length} partners, demo customer: sara@example.com`);
  }

  // Phase 1 demo accounts — lets you log into the Restaurant Panel and Admin Panel
  // immediately without building a sign-up flow first. Runs regardless of whether
  // restaurants were just created or already existed, so re-running this script after
  // the database already has partners still gets you working logins.
  const firstPartner = createdPartners[0];
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
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .then(() => process.exit(0));
