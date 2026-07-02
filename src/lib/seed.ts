import { findOrCreateCity, createPartner, seedDemoCustomerIfMissing, listApprovedPartners, createUser, getUserByEmail, ensureRiderProfile } from "./db";
import { hashPassword } from "./auth-node";

interface MenuItem { category: string; name: string; nameAr: string; description: string; price: number; }
interface R { name: string; nameAr: string; cuisineTag: string; heroEmoji: string; ratingAvg: number; etaMinsLow: number; etaMinsHigh: number; lat?: number; lng?: number; items: MenuItem[]; }

async function seedCity(cityName: string, country: string, currency: string, restaurants: R[]) {
  const city = await findOrCreateCity(cityName, country, currency);
  await seedDemoCustomerIfMissing(city.id);
  const existing = await listApprovedPartners(cityName);
  if (existing.length > 0) {
    console.log(`  ${cityName}: already seeded (${existing.length}), skip.`);
    return { city, partners: existing };
  }
  const created = [];
  for (const r of restaurants) {
    created.push(await createPartner({ ...r, cityId: city.id }));
  }
  console.log(`  ${cityName}: seeded ${created.length} restaurants.`);
  return { city, partners: created };
}

async function main() {
  console.log("Seeding Wasla Souq — Phase 2 multi-city...\n");

  // ╔══════════════════════════════════════════════════════════╗
  // ║  UAE                                                     ║
  // ╚══════════════════════════════════════════════════════════╝
  console.log("🇦🇪 UAE");
  await seedCity("Dubai", "United Arab Emirates", "AED", [
    { name:"Manqal Grill House", nameAr:"بيت منقل الشواء", cuisineTag:"Mixed grill · Levantine", heroEmoji:"🍢", ratingAvg:4.8, etaMinsLow:22, etaMinsHigh:32, lat:25.0805, lng:55.1403,
      items:[{category:"mains",name:"Mixed Grill Platter",nameAr:"مشاوي مشكلة",description:"Chicken, lamb & kofta, grilled rice",price:38},{category:"mains",name:"Shish Tawook",nameAr:"شيش طاووق",description:"Marinated chicken skewers",price:24},{category:"sides",name:"Fattoush Salad",nameAr:"فتوش",description:"Crispy pita, sumac, pomegranate",price:14},{category:"sides",name:"Garlic Toum",nameAr:"ثوم",description:"Lebanese garlic sauce",price:5}]},
    { name:"Saffron & Sumac", nameAr:"زعفران وسماق", cuisineTag:"Mandi · Biryani · Kabsa", heroEmoji:"🍛", ratingAvg:4.9, etaMinsLow:28, etaMinsHigh:38, lat:25.0763, lng:55.1339,
      items:[{category:"mains",name:"Chicken Mandi",nameAr:"مندي دجاج",description:"Slow-roasted chicken, spiced rice",price:32},{category:"mains",name:"Lamb Kabsa",nameAr:"كبسة لحم",description:"Spiced rice with tender lamb",price:42},{category:"mains",name:"Vegetable Biryani",nameAr:"برياني خضار",description:"Fragrant rice, mixed vegetables",price:22},{category:"mains",name:"Lamb Ouzi",nameAr:"أوزي لحم",description:"Whole roasted lamb on rice",price:45}]},
    { name:"Karak Corner", nameAr:"زاوية الكرك", cuisineTag:"Karak tea · Breakfast", heroEmoji:"☕", ratingAvg:4.7, etaMinsLow:15, etaMinsHigh:20,
      items:[{category:"drinks",name:"Karak Chai",nameAr:"كرك",description:"Spiced milk tea",price:6},{category:"mains",name:"Chicken Paratha Roll",nameAr:"رول فراطة دجاج",description:"Spiced chicken, flaky paratha",price:16},{category:"mains",name:"Cheese Manousheh",nameAr:"منقوشة جبنة",description:"Baked flatbread with cheese",price:12}]},
    { name:"Bait Al Shawarma", nameAr:"بيت الشاورما", cuisineTag:"Shawarma · Fries · Juices", heroEmoji:"🥙", ratingAvg:4.6, etaMinsLow:18, etaMinsHigh:26,
      items:[{category:"mains",name:"Chicken Shawarma Wrap",nameAr:"شاورما دجاج",description:"Garlic sauce, pickles",price:13},{category:"mains",name:"Beef Shawarma Plate",nameAr:"صحن شاورما لحم",description:"With rice and salad",price:26},{category:"sides",name:"Loaded Fries",nameAr:"بطاطا مشكلة",description:"Cheese, garlic sauce, parsley",price:15},{category:"drinks",name:"Fresh Lemon & Mint",nameAr:"ليمون نعناع",description:"Freshly squeezed",price:9}]},
    { name:"The Noodle House Dubai", nameAr:"ذا نودل هاوس دبي", cuisineTag:"Asian · Noodles · Dim Sum", heroEmoji:"🍜", ratingAvg:4.5, etaMinsLow:25, etaMinsHigh:40,
      items:[{category:"mains",name:"Pad Thai",nameAr:"باد تاي",description:"Rice noodles, tamarind, peanuts",price:52},{category:"mains",name:"Wonton Soup",nameAr:"شوربة وونتون",description:"Pork & prawn dumplings, clear broth",price:38},{category:"sides",name:"Spring Rolls ×4",nameAr:"ربيع رولز ×4",description:"Crispy vegetable rolls",price:28}]},
    { name:"Zahr El-Laymoun", nameAr:"زهر الليمون", cuisineTag:"Lebanese · Mezze · Grills", heroEmoji:"🌿", ratingAvg:4.8, etaMinsLow:20, etaMinsHigh:35,
      items:[{category:"mains",name:"Kafta Bil Saniyeh",nameAr:"كفتة بالصينية",description:"Baked minced meat with tomato",price:42},{category:"sides",name:"Hummus Beiruti",nameAr:"حمص بيروتي",description:"Chunky hummus, olive oil, paprika",price:22},{category:"sides",name:"Moutabal",nameAr:"متبل",description:"Smoky aubergine with tahini",price:22},{category:"drinks",name:"Jallab",nameAr:"جلاب",description:"Rose water, grape juice, raisins",price:15}]},
    { name:"Punjab Grill Dubai", nameAr:"بنجاب غريل دبي", cuisineTag:"Indian · Curry · Tandoor", heroEmoji:"🍲", ratingAvg:4.7, etaMinsLow:30, etaMinsHigh:45,
      items:[{category:"mains",name:"Butter Chicken",nameAr:"دجاج بالزبدة",description:"Tandoor chicken in creamy tomato sauce",price:55},{category:"mains",name:"Lamb Rogan Josh",nameAr:"لحم روغان جوش",description:"Kashmiri spiced braised lamb",price:65},{category:"sides",name:"Garlic Naan",nameAr:"خبز نان ثوم",description:"Leavened flatbread from tandoor",price:12}]},
    { name:"McDonald's Dubai Marina", nameAr:"ماكدونالدز دبي مارينا", cuisineTag:"Burgers · Fries · Breakfast", heroEmoji:"🍔", ratingAvg:4.2, etaMinsLow:15, etaMinsHigh:25,
      items:[{category:"mains",name:"Big Mac",nameAr:"بيغ ماك",description:"Two beef patties, special sauce",price:23},{category:"mains",name:"McArabia Chicken",nameAr:"المك عربيا دجاج",description:"Grilled chicken, Arabic bread",price:21},{category:"sides",name:"Large Fries",nameAr:"بطاطس كبير",description:"Golden crispy fries",price:11},{category:"drinks",name:"McFlurry Oreo",nameAr:"ماك فلوري أوريو",description:"Soft serve with Oreo pieces",price:14}]},
    { name:"Luciano's Dubai", nameAr:"لوتشيانو دبي", cuisineTag:"Italian · Pizza · Pasta", heroEmoji:"🍕", ratingAvg:4.6, etaMinsLow:25, etaMinsHigh:40,
      items:[{category:"mains",name:"Truffle Mushroom Pizza",nameAr:"بيتزا ترافل فطر",description:"Black truffle, wild mushrooms, mozzarella",price:72},{category:"mains",name:"Spaghetti Carbonara",nameAr:"سباغيتي كاربوناره",description:"Guanciale, egg yolk, pecorino",price:58},{category:"desserts",name:"Tiramisu",nameAr:"تيراميسو",description:"Espresso-soaked ladyfingers, mascarpone",price:32}]},
    { name:"Tim Hortons Dubai", nameAr:"تيم هورتنز دبي", cuisineTag:"Coffee · Donuts · Breakfast", heroEmoji:"☕", ratingAvg:4.3, etaMinsLow:10, etaMinsHigh:20,
      items:[{category:"drinks",name:"Double Double",nameAr:"دبل دبل",description:"Coffee with two cream, two sugar",price:14},{category:"mains",name:"Breakfast Wrap",nameAr:"راب إفطار",description:"Egg, cheese, turkey bacon",price:22},{category:"sides",name:"Timbits ×10",nameAr:"تيمبيتس ×10",description:"Mini donut holes, mixed flavors",price:18}]},
    { name:"PF Chang's Dubai", nameAr:"بي إف تشانغ دبي", cuisineTag:"Asian Fusion · Chinese", heroEmoji:"🥢", ratingAvg:4.5, etaMinsLow:30, etaMinsHigh:45,
      items:[{category:"mains",name:"Mongolian Beef",nameAr:"لحم مغولي",description:"Crispy beef, green onions, soy-ginger",price:68},{category:"mains",name:"Kung Pao Shrimp",nameAr:"روبيان كونغ باو",description:"Spicy, peanuts, chili",price:72},{category:"sides",name:"Lettuce Wraps",nameAr:"لفائف خس",description:"Minced chicken, water chestnuts",price:55}]},
    { name:"Automatic Restaurant Dubai", nameAr:"مطعم أوتوماتيك دبي", cuisineTag:"Lebanese · Street food", heroEmoji:"🧆", ratingAvg:4.6, etaMinsLow:18, etaMinsHigh:28,
      items:[{category:"mains",name:"Falafel Wrap",nameAr:"رول فلافل",description:"Falafel, tahini, vegetables",price:16},{category:"mains",name:"Manaqeesh Zaatar",nameAr:"مناقيش زعتر",description:"Thyme & olive oil flatbread",price:10},{category:"sides",name:"Tabbouleh",nameAr:"تبولة",description:"Parsley, tomato, lemon, bulgur",price:18}]},
  ]);

  await seedCity("Abu Dhabi", "United Arab Emirates", "AED", [
    { name:"Emirates Palace Dining", nameAr:"مطعم قصر الإمارات", cuisineTag:"International · Fine Dining", heroEmoji:"👑", ratingAvg:4.9, etaMinsLow:35, etaMinsHigh:50, lat:24.4539, lng:54.3173,
      items:[{category:"mains",name:"Wagyu Tenderloin",nameAr:"لحم واغيو",description:"250g, truffle butter, seasonal vegetables",price:320},{category:"mains",name:"Lobster Thermidor",nameAr:"لوبستر ثيرمودور",description:"Classic French preparation",price:280},{category:"desserts",name:"Gold Cappuccino",nameAr:"كابوتشينو ذهبي",description:"Edible gold leaf, dark chocolate",price:75}]},
    { name:"Sayad Abu Dhabi", nameAr:"الصياد أبوظبي", cuisineTag:"Seafood · Arabic · Grills", heroEmoji:"🐟", ratingAvg:4.8, etaMinsLow:30, etaMinsHigh:45,
      items:[{category:"mains",name:"Hammour Mashwi",nameAr:"هامور مشوي",description:"Grilled grouper, garlic, lemon",price:145},{category:"mains",name:"Mixed Seafood Platter",nameAr:"مشاوي البحر المشكلة",description:"Prawns, hammour, calamari, crab",price:220},{category:"sides",name:"Arabic Salad",nameAr:"سلطة عربية",description:"Cucumber, tomato, lemon, mint",price:35}]},
    { name:"Beirut Sur Mer", nameAr:"بيروت سور مير", cuisineTag:"Lebanese · Seafood", heroEmoji:"🌊", ratingAvg:4.7, etaMinsLow:25, etaMinsHigh:40,
      items:[{category:"mains",name:"Sayadieh",nameAr:"صيادية",description:"Fish over caramelized onion rice",price:88},{category:"sides",name:"Labneh Bil Zaatar",nameAr:"لبنة بالزعتر",description:"Strained yoghurt, thyme, olive oil",price:28},{category:"drinks",name:"Fresh Pomegranate Juice",nameAr:"عصير رمان طازج",description:"Cold pressed pomegranate",price:22}]},
    { name:"Pizza Express Abu Dhabi", nameAr:"بيتزا إكسبريس أبوظبي", cuisineTag:"Pizza · Pasta · Salads", heroEmoji:"🍕", ratingAvg:4.4, etaMinsLow:25, etaMinsHigh:40,
      items:[{category:"mains",name:"Padana Pizza",nameAr:"بيتزا بادانا",description:"Goat cheese, caramelized onions, spinach",price:58},{category:"mains",name:"Pollo Ad Astra",nameAr:"بولو أد أسترا",description:"Chicken, rocket, Parmesan",price:62},{category:"sides",name:"Dough Balls",nameAr:"كرات العجين",description:"With garlic butter",price:28}]},
    { name:"Bu Qtair Abu Dhabi", nameAr:"بو قطير أبوظبي", cuisineTag:"Emirati · Fish · Simple", heroEmoji:"🎣", ratingAvg:4.9, etaMinsLow:20, etaMinsHigh:35,
      items:[{category:"mains",name:"Fried Hammour",nameAr:"هامور مقلي",description:"Fresh grouper, Emirati spices",price:75},{category:"mains",name:"Prawn Curry",nameAr:"كاري الروبيان",description:"Local prawns, spiced tomato",price:65},{category:"sides",name:"Khameer Bread",nameAr:"خبز الخمير",description:"Traditional Emirati bread",price:8}]},
    { name:"Hakkasan Abu Dhabi", nameAr:"هكاسان أبوظبي", cuisineTag:"Cantonese · Dim Sum · Modern", heroEmoji:"🥟", ratingAvg:4.8, etaMinsLow:30, etaMinsHigh:50,
      items:[{category:"mains",name:"Crispy Duck Salad",nameAr:"سلطة البط المقرمش",description:"Pomelo, pine nuts, shallots",price:115},{category:"mains",name:"Dim Sum Basket",nameAr:"سلة ديم سام",description:"Har gau, siu mai, char siu bao",price:85},{category:"mains",name:"Black Bean Seabass",nameAr:"قاروص بالفاصولياء السوداء",description:"Steamed, ginger, spring onion",price:128}]},
    { name:"The Cheesecake Factory Abu Dhabi", nameAr:"ذا تشيزكيك فاكتوري أبوظبي", cuisineTag:"American · Pasta · Desserts", heroEmoji:"🎂", ratingAvg:4.5, etaMinsLow:30, etaMinsHigh:45,
      items:[{category:"mains",name:"Pasta Carbonara",nameAr:"باستا كاربوناره",description:"Pancetta, egg, Parmesan, black pepper",price:72},{category:"mains",name:"Avocado Egg Rolls",nameAr:"لفائف البيض والأفوكادو",description:"Avocado, sun-dried tomato, tamarind",price:52},{category:"desserts",name:"Original Cheesecake",nameAr:"تشيزكيك أصلي",description:"New York style, sour cream",price:38}]},
    { name:"Paris Gallery Café", nameAr:"كافيه باريس غاليري", cuisineTag:"French Café · Crêpes · Coffee", heroEmoji:"🥐", ratingAvg:4.4, etaMinsLow:20, etaMinsHigh:30,
      items:[{category:"mains",name:"Crêpe Suzette",nameAr:"كريب سوزيت",description:"Orange butter, Grand Marnier sauce",price:42},{category:"drinks",name:"Café Crème",nameAr:"كافيه كريم",description:"Double espresso, warm milk",price:22},{category:"sides",name:"Croissant au Beurre",nameAr:"كرواسون بالزبدة",description:"All-butter Viennoiserie",price:18}]},
  ]);

  await seedCity("Sharjah", "United Arab Emirates", "AED", [
    { name:"Al Fanar Restaurant Sharjah", nameAr:"مطعم الفنار الشارقة", cuisineTag:"Emirati · Traditional", heroEmoji:"🏛️", ratingAvg:4.8, etaMinsLow:25, etaMinsHigh:40, lat:25.3462, lng:55.4209,
      items:[{category:"mains",name:"Harees",nameAr:"هريس",description:"Wheat & chicken slow-cooked porridge",price:35},{category:"mains",name:"Saloona Laham",nameAr:"صالونة لحم",description:"Emirati meat stew with vegetables",price:42},{category:"sides",name:"Chami Bread",nameAr:"خبز الشامي",description:"Thin Emirati flatbread",price:5}]},
    { name:"Bu Qtair Sharjah", nameAr:"بو قطير الشارقة", cuisineTag:"Fish · Emirati · Quick", heroEmoji:"🐠", ratingAvg:4.7, etaMinsLow:15, etaMinsHigh:25,
      items:[{category:"mains",name:"Kingfish Masala",nameAr:"كنعد ماسالا",description:"Spiced fried kingfish",price:55},{category:"mains",name:"Mixed Fried Fish",nameAr:"سمك مقلي مشكل",description:"Barracuda, hamour, safi",price:65},{category:"sides",name:"Chips & Chilli Sauce",nameAr:"بطاطس وصلصة حارة",description:"House-made chilli sauce",price:12}]},
    { name:"Marguerite Sharjah", nameAr:"مارغريت الشارقة", cuisineTag:"Lebanese · Family dining", heroEmoji:"🌺", ratingAvg:4.5, etaMinsLow:20, etaMinsHigh:35,
      items:[{category:"mains",name:"Kofta Bil Saniyeh",nameAr:"كفتة بالصينية",description:"Baked minced lamb, tomato",price:38},{category:"sides",name:"Warak Dawali",nameAr:"ورق دوالي",description:"Stuffed vine leaves, lemon, rice",price:25},{category:"drinks",name:"Ayran",nameAr:"عيران",description:"Cold salted yoghurt drink",price:8}]},
    { name:"Subway Sharjah", nameAr:"صب واي الشارقة", cuisineTag:"Sandwiches · Wraps · Salads", heroEmoji:"🥖", ratingAvg:4.1, etaMinsLow:10, etaMinsHigh:20,
      items:[{category:"mains",name:"Chicken Teriyaki 30cm",nameAr:"دجاج تيرياكي 30 سم",description:"Teriyaki chicken, vegetables, your choice of bread",price:28},{category:"mains",name:"BMT Footlong",nameAr:"بي إم تي فوت لونغ",description:"Pepperoni, salami, ham",price:30},{category:"sides",name:"Chips Ahoy Cookie",nameAr:"بسكويت شيبس أهوي",description:"Chocolate chip cookie",price:6}]},
    { name:"Biryani Pot Sharjah", nameAr:"بيرياني بوت الشارقة", cuisineTag:"Biryani · Indian · Curry", heroEmoji:"🍚", ratingAvg:4.6, etaMinsLow:25, etaMinsHigh:40,
      items:[{category:"mains",name:"Hyderabadi Chicken Biryani",nameAr:"برياني دجاج حيدرآبادي",description:"Dum-cooked, saffron, fried onions",price:38},{category:"mains",name:"Mutton Biryani",nameAr:"برياني لحم ضأن",description:"Slow-cooked mutton, spiced basmati",price:48},{category:"sides",name:"Raita",nameAr:"رايتا",description:"Yoghurt, cucumber, mint",price:8}]},
  ]);

  await seedCity("Ajman", "United Arab Emirates", "AED", [
    { name:"Golden Fork Ajman", nameAr:"الشوكة الذهبية عجمان", cuisineTag:"Arabic · Grills · Family", heroEmoji:"🍽️", ratingAvg:4.5, etaMinsLow:20, etaMinsHigh:35,
      items:[{category:"mains",name:"Chicken Ouzi",nameAr:"أوزي دجاج",description:"Whole chicken over spiced rice",price:45},{category:"mains",name:"Grilled Hammour",nameAr:"هامور مشوي",description:"Local grouper, garlic butter",price:68},{category:"sides",name:"Mixed Salad",nameAr:"سلطة مشكلة",description:"Fresh garden salad",price:12}]},
    { name:"Shish Arabia Ajman", nameAr:"شيش عربية عجمان", cuisineTag:"Grills · Shawarma", heroEmoji:"🔥", ratingAvg:4.4, etaMinsLow:15, etaMinsHigh:25,
      items:[{category:"mains",name:"Mixed Grill for 2",nameAr:"مشاوي مشكلة لشخصين",description:"Chicken, lamb, kofta",price:75},{category:"mains",name:"Chicken Shawarma",nameAr:"شاورما دجاج",description:"Garlic, pickles, fries",price:12}]},
  ]);

  await seedCity("Ras Al Khaimah", "United Arab Emirates", "AED", [
    { name:"Marakesh RAK", nameAr:"مراكش رأس الخيمة", cuisineTag:"Moroccan · Tagine · Couscous", heroEmoji:"🏺", ratingAvg:4.7, etaMinsLow:30, etaMinsHigh:45,
      items:[{category:"mains",name:"Lamb Tagine",nameAr:"طاجين لحم",description:"Slow-cooked with preserved lemon, olives",price:65},{category:"mains",name:"Chicken Pastilla",nameAr:"بستيلة دجاج",description:"Flaky pastry, chicken, almonds, cinnamon",price:72},{category:"sides",name:"Moroccan Mint Tea",nameAr:"شاي مغربي بالنعناع",description:"Fresh mint, gunpowder tea",price:15}]},
    { name:"Al Hamra Cellar RAK", nameAr:"الحمرا سيلار رأس الخيمة", cuisineTag:"International · Steak · Seafood", heroEmoji:"🥩", ratingAvg:4.6, etaMinsLow:30, etaMinsHigh:50,
      items:[{category:"mains",name:"Angus Ribeye 300g",nameAr:"أنغوس ريب آي 300 غ",description:"Grilled, fries, seasonal salad",price:125},{category:"mains",name:"Salmon Wellington",nameAr:"سالمون ويلينغتون",description:"Wrapped in puff pastry, cream sauce",price:98},{category:"desserts",name:"Crème Brûlée",nameAr:"كريم بروليه",description:"Vanilla custard, caramelized sugar",price:32}]},
  ]);

  // ╔══════════════════════════════════════════════════════════╗
  // ║  SAUDI ARABIA                                            ║
  // ╚══════════════════════════════════════════════════════════╝
  console.log("🇸🇦 Saudi Arabia");
  await seedCity("Riyadh", "Saudi Arabia", "SAR", [
    { name:"Najd Village", nameAr:"قرية نجد", cuisineTag:"Saudi · Kabsa · Jareesh", heroEmoji:"🍚", ratingAvg:4.9, etaMinsLow:25, etaMinsHigh:40, lat:24.7136, lng:46.6753,
      items:[{category:"mains",name:"Lamb Kabsa",nameAr:"كبسة لحم",description:"Slow-cooked lamb, basmati, dried fruits",price:55},{category:"mains",name:"Jareesh",nameAr:"جريش",description:"Cracked wheat with lamb",price:35},{category:"mains",name:"Margoog",nameAr:"مرقوق",description:"Meat & vegetable bread stew",price:42},{category:"sides",name:"Dates & Ghee",nameAr:"تمر وسمن",description:"Medjool dates with clarified butter",price:18}]},
    { name:"Al Romansiah Riyadh", nameAr:"الرومانسية الرياض", cuisineTag:"Grills · Shawarma · Mandi", heroEmoji:"🔥", ratingAvg:4.7, etaMinsLow:20, etaMinsHigh:35,
      items:[{category:"mains",name:"Chicken Mandi",nameAr:"مندي دجاج",description:"Riyadh-style slow-roasted",price:38},{category:"mains",name:"Mixed Tikka",nameAr:"تيكا مشكلة",description:"Marinated chicken & beef",price:49},{category:"sides",name:"Tabbouleh",nameAr:"تبولة",description:"Fresh parsley, tomato, bulgur",price:16},{category:"drinks",name:"Saudi Qahwa",nameAr:"قهوة سعودية",description:"Cardamom coffee with dates",price:12}]},
    { name:"Maestro Pizza Riyadh", nameAr:"مايسترو بيتزا الرياض", cuisineTag:"Pizza · Pasta · Italian", heroEmoji:"🍕", ratingAvg:4.5, etaMinsLow:30, etaMinsHigh:45,
      items:[{category:"mains",name:"Zaatar & Cheese Pizza",nameAr:"بيتزا زعتر وجبن",description:"Thyme, mozzarella, olive oil",price:45},{category:"mains",name:"BBQ Chicken Pizza",nameAr:"بيتزا دجاج باربيكيو",description:"Smoked chicken, peppers",price:52},{category:"sides",name:"Garlic Bread",nameAr:"خبز بالثوم",description:"Crispy baguette, garlic butter",price:18}]},
    { name:"Herfy Riyadh", nameAr:"هرفي الرياض", cuisineTag:"Burgers · Fries · Saudi Fast Food", heroEmoji:"🍔", ratingAvg:4.3, etaMinsLow:15, etaMinsHigh:25,
      items:[{category:"mains",name:"Double Herfy Burger",nameAr:"دبل هرفي برغر",description:"Two beef patties, cheese, sauce",price:28},{category:"mains",name:"Crispy Chicken Burger",nameAr:"برغر دجاج كريسبي",description:"Crispy fried chicken, coleslaw",price:24},{category:"sides",name:"Onion Rings",nameAr:"حلقات البصل",description:"Golden crispy onion rings",price:12}]},
    { name:"Lusin Riyadh", nameAr:"لوسين الرياض", cuisineTag:"Armenian · Grills · Mezze", heroEmoji:"🫕", ratingAvg:4.8, etaMinsLow:25, etaMinsHigh:40,
      items:[{category:"mains",name:"Khorovatz Mixed Grill",nameAr:"مشاوي مشكلة أرمنية",description:"Lamb, pork, vegetables on charcoal",price:72},{category:"mains",name:"Ishkhan Trout",nameAr:"سمك تراوت",description:"Pan-fried Sevan trout, herbs",price:65},{category:"sides",name:"Manti Dumplings",nameAr:"مانتي",description:"Armenian beef dumplings, yoghurt, butter",price:38}]},
    { name:"Elevation Burger Riyadh", nameAr:"إيليفيشن برغر الرياض", cuisineTag:"Organic Burgers · Fries", heroEmoji:"🥬", ratingAvg:4.4, etaMinsLow:20, etaMinsHigh:30,
      items:[{category:"mains",name:"Elevation Burger",nameAr:"إيليفيشن برغر",description:"Organic beef, organic cheese, lettuce",price:32},{category:"mains",name:"Veggie Burger",nameAr:"برغر نباتي",description:"Black bean patty, avocado",price:28},{category:"sides",name:"Vertical Fries",nameAr:"بطاطس عمودية",description:"Cooked vertically in olive oil",price:15}]},
    { name:"Al Baik Riyadh", nameAr:"البيك الرياض", cuisineTag:"Fried Chicken · Shrimp · Saudi Icon", heroEmoji:"🍗", ratingAvg:4.8, etaMinsLow:20, etaMinsHigh:30,
      items:[{category:"mains",name:"Broasted Chicken Meal",nameAr:"وجبة دجاج بروستد",description:"2 pieces, fries, garlic sauce",price:22},{category:"mains",name:"Shrimp Dinner",nameAr:"عشاء روبيان",description:"Crispy fried shrimp, tartar sauce",price:28},{category:"sides",name:"Dinner Roll",nameAr:"خبز الوجبة",description:"Soft golden roll",price:3}]},
    { name:"Texas de Brazil Riyadh", nameAr:"تكساس دي برازيل الرياض", cuisineTag:"Brazilian · Churrasco · Steakhouse", heroEmoji:"🥩", ratingAvg:4.7, etaMinsLow:30, etaMinsHigh:50,
      items:[{category:"mains",name:"Churrasco Experience",nameAr:"تجربة الشواء البرازيلي",description:"Unlimited cuts: picanha, lamb chops, chicken",price:189},{category:"sides",name:"Brazilian Feijoada",nameAr:"فيجوادا برازيلية",description:"Black bean & meat stew",price:42},{category:"desserts",name:"Papaya Cream",nameAr:"كريم البابايا",description:"Fresh papaya with cream cheese",price:28}]},
    { name:"Noodle House Riyadh", nameAr:"نودل هاوس الرياض", cuisineTag:"Asian · Noodles · Dim Sum", heroEmoji:"🍜", ratingAvg:4.5, etaMinsLow:25, etaMinsHigh:40,
      items:[{category:"mains",name:"Singapore Laksa",nameAr:"لاكسا سنغافورة",description:"Coconut curry broth, prawns, rice noodles",price:48},{category:"mains",name:"Char Kway Teow",nameAr:"تشار كواي تيو",description:"Wok-fried flat noodles",price:42},{category:"sides",name:"Prawn Har Gau ×4",nameAr:"هار غاو ×4",description:"Steamed prawn dumplings",price:28}]},
    { name:"Kababji Riyadh", nameAr:"كبابجي الرياض", cuisineTag:"Lebanese · Grills · Shawarma", heroEmoji:"🍡", ratingAvg:4.6, etaMinsLow:20, etaMinsHigh:35,
      items:[{category:"mains",name:"Kafta Kebab Plate",nameAr:"طبق كباب كفتة",description:"Minced lamb kebabs, rice, salad",price:42},{category:"mains",name:"Chicken Shish",nameAr:"شيش دجاج",description:"Marinated chicken on skewer",price:38},{category:"sides",name:"Hummus with Meat",nameAr:"حمص باللحمة",description:"Warm hummus, minced lamb",price:22}]},
    { name:"The Social Café Riyadh", nameAr:"ذا سوشيال كافيه الرياض", cuisineTag:"Café · Brunch · Sandwiches", heroEmoji:"☕", ratingAvg:4.4, etaMinsLow:15, etaMinsHigh:25,
      items:[{category:"mains",name:"Eggs Benedict",nameAr:"بيض بنديكت",description:"Poached eggs, hollandaise, sourdough",price:38},{category:"drinks",name:"Caramel Macchiato",nameAr:"ماكياتو كراميل",description:"Espresso, vanilla, caramel",price:22},{category:"sides",name:"Banana Bread",nameAr:"خبز الموز",description:"Homemade, walnuts, cream cheese",price:18}]},
    { name:"Mezzaterra Riyadh", nameAr:"ميزاتيرا الرياض", cuisineTag:"Mediterranean · Mezze · Seafood", heroEmoji:"🌊", ratingAvg:4.7, etaMinsLow:25, etaMinsHigh:40,
      items:[{category:"mains",name:"Sea Bass Fillet",nameAr:"فيليه لوت البحر",description:"Grilled, lemon butter, capers",price:78},{category:"sides",name:"Mixed Mezze Board",nameAr:"طبق مازة مشكلة",description:"Hummus, mutabal, tabbouleh, bread",price:48},{category:"drinks",name:"Fresh Passion Mojito",nameAr:"موهيتو برشمي طازج",description:"Passion fruit, mint, lime",price:22}]},
  ]);

  await seedCity("Jeddah", "Saudi Arabia", "SAR", [
    { name:"Al Baik Jeddah", nameAr:"البيك جدة", cuisineTag:"Fried Chicken · Saudi Icon", heroEmoji:"🍗", ratingAvg:4.9, etaMinsLow:15, etaMinsHigh:25, lat:21.4858, lng:39.1925,
      items:[{category:"mains",name:"Broasted Chicken 2-piece",nameAr:"دجاج بروستد 2 قطعة",description:"Fries, garlic sauce",price:22},{category:"mains",name:"Shrimp Dinner",nameAr:"عشاء روبيان",description:"Crispy fried shrimp",price:28},{category:"sides",name:"Coleslaw",nameAr:"كول سلو",description:"Creamy cabbage slaw",price:6}]},
    { name:"Fakieh Seafood Jeddah", nameAr:"مطعم فقيه البحري جدة", cuisineTag:"Seafood · Fresh Fish · Grills", heroEmoji:"🦐", ratingAvg:4.8, etaMinsLow:25, etaMinsHigh:40,
      items:[{category:"mains",name:"Shrimp Kabsa",nameAr:"كبسة روبيان",description:"Spiced prawn rice",price:55},{category:"mains",name:"Sayadieh Jeddawi",nameAr:"صيادية جداوية",description:"Fish over caramelized rice, Jeddah style",price:62},{category:"sides",name:"Grilled Corn",nameAr:"ذرة مشوية",description:"Butter, spices",price:8}]},
    { name:"Kofeat Jeddah", nameAr:"كوفيت جدة", cuisineTag:"Coffee · Specialty · Desserts", heroEmoji:"☕", ratingAvg:4.7, etaMinsLow:15, etaMinsHigh:25,
      items:[{category:"drinks",name:"Iced White Mocha",nameAr:"موكا أبيض على الثلج",description:"Espresso, white chocolate, milk",price:22},{category:"drinks",name:"Matcha Latte",nameAr:"ماتشا لاتيه",description:"Japanese matcha, oat milk",price:24},{category:"sides",name:"Croissant Zaatar",nameAr:"كرواسون زعتر",description:"Buttery croissant with thyme",price:15}]},
    { name:"Casper & Gambini's Jeddah", nameAr:"كاسبر وغامبيني جدة", cuisineTag:"International · Brunch · Café", heroEmoji:"🍳", ratingAvg:4.5, etaMinsLow:20, etaMinsHigh:35,
      items:[{category:"mains",name:"Full English Breakfast",nameAr:"فطور إنجليزي كامل",description:"Eggs, bacon, beans, toast, mushrooms",price:48},{category:"mains",name:"Chicken Caesar Wrap",nameAr:"راب دجاج سيزر",description:"Grilled chicken, romaine, Caesar",price:38},{category:"desserts",name:"Red Velvet Cake",nameAr:"كيك ريد فيلفيت",description:"Cream cheese frosting",price:28}]},
    { name:"Layali Zaman Jeddah", nameAr:"ليالي زمان جدة", cuisineTag:"Saudi · Traditional · Family", heroEmoji:"🏮", ratingAvg:4.8, etaMinsLow:30, etaMinsHigh:45,
      items:[{category:"mains",name:"Hashi Camel Kabsa",nameAr:"كبسة هاشي الجمل",description:"Traditional Hejazi camel rice",price:85},{category:"mains",name:"Chicken Haneeth",nameAr:"دجاج هنيث",description:"Slow-cooked spiced chicken",price:52},{category:"sides",name:"Maras Dates",nameAr:"تمر مرس",description:"Hejaz region dates with butter",price:25}]},
    { name:"Five Guys Jeddah", nameAr:"فايف غايز جدة", cuisineTag:"Burgers · Fries · Milkshakes", heroEmoji:"🍟", ratingAvg:4.4, etaMinsLow:20, etaMinsHigh:30,
      items:[{category:"mains",name:"Cheeseburger",nameAr:"تشيز برغر",description:"Two patties, your choice of toppings",price:38},{category:"mains",name:"Veggie Sandwich",nameAr:"ساندويش نباتي",description:"Grilled mushrooms, peppers, onions",price:32},{category:"sides",name:"Cajun Fries",nameAr:"بطاطس كاجون",description:"Secret Cajun seasoning",price:18}]},
    { name:"Takya Turkish Jeddah", nameAr:"تكية التركية جدة", cuisineTag:"Turkish · Kebab · Pide", heroEmoji:"🫔", ratingAvg:4.6, etaMinsLow:25, etaMinsHigh:40,
      items:[{category:"mains",name:"İskender Kebab",nameAr:"إسكندر كباب",description:"Lamb doner over pide, yoghurt, tomato butter",price:58},{category:"mains",name:"Lahmacun",nameAr:"لحمعجين",description:"Turkish thin-crust minced lamb flatbread",price:22},{category:"drinks",name:"Ayran",nameAr:"عيران",description:"Cold salted yoghurt",price:8}]},
    { name:"Sushi Masa Jeddah", nameAr:"سوشي ماسا جدة", cuisineTag:"Sushi · Japanese · Fusion", heroEmoji:"🍱", ratingAvg:4.7, etaMinsLow:30, etaMinsHigh:50,
      items:[{category:"mains",name:"Dragon Roll",nameAr:"رول التنين",description:"Shrimp tempura, avocado, eel sauce",price:65},{category:"mains",name:"Salmon Sashimi 8pc",nameAr:"سالمون ساشيمي 8 قطع",description:"Fresh Norwegian salmon",price:72},{category:"sides",name:"Miso Soup",nameAr:"شوربة ميسو",description:"Tofu, wakame, green onion",price:15}]},
    { name:"Al Reef Al Yamani Jeddah", nameAr:"الريف اليماني جدة", cuisineTag:"Yemeni · Haneeth · Mandi", heroEmoji:"🍲", ratingAvg:4.8, etaMinsLow:25, etaMinsHigh:40,
      items:[{category:"mains",name:"Lamb Haneeth",nameAr:"هنيث لحم",description:"Clay-pot slow-roasted lamb",price:72},{category:"mains",name:"Chicken Fahsa",nameAr:"فحسة دجاج",description:"Yemeni stew in stone pot",price:45},{category:"drinks",name:"Shahi Tea",nameAr:"شاي شاهي",description:"Yemeni spiced sweet tea",price:8}]},
    { name:"Wings & Rings Jeddah", nameAr:"وينغز أند رينغز جدة", cuisineTag:"Wings · Burgers · American", heroEmoji:"🍗", ratingAvg:4.3, etaMinsLow:20, etaMinsHigh:35,
      items:[{category:"mains",name:"Buffalo Wings 10pc",nameAr:"أجنحة بافالو ×10",description:"Classic Buffalo sauce, blue cheese dip",price:42},{category:"mains",name:"Onion Ring Burger",nameAr:"برغر حلقات البصل",description:"Beef patty, crispy onion ring",price:38},{category:"sides",name:"Mac & Cheese Bites",nameAr:"ماك وتشيز قضمات",description:"Crispy fried mac & cheese",price:22}]},
  ]);

  await seedCity("Mecca", "Saudi Arabia", "SAR", [
    { name:"Zamzam Tower Restaurant", nameAr:"مطعم أبراج زمزم", cuisineTag:"International · Buffet · Halal", heroEmoji:"🕌", ratingAvg:4.7, etaMinsLow:20, etaMinsHigh:35, lat:21.3891, lng:39.8579,
      items:[{category:"mains",name:"Lamb Ouzi",nameAr:"أوزي لحم",description:"Mecca-style roasted lamb on rice",price:65},{category:"mains",name:"Chicken Mandi",nameAr:"مندي دجاج",description:"Fragrant Yemeni-style chicken",price:42},{category:"sides",name:"Dates Platter",nameAr:"طبق تمور",description:"Assorted Mecca dates",price:22}]},
    { name:"Al Marwa Rayhaan Dining", nameAr:"مطاعم الجوهرة رحيق", cuisineTag:"Arabic · International · Hotel", heroEmoji:"🌙", ratingAvg:4.8, etaMinsLow:25, etaMinsHigh:40,
      items:[{category:"mains",name:"Saudi Kabsa",nameAr:"كبسة سعودية",description:"Lamb, rice, nuts, raisins",price:55},{category:"mains",name:"Grilled Sea Bass",nameAr:"لوت البحر المشوي",description:"Red Sea fish, herbs, lemon",price:72},{category:"drinks",name:"Habesha Coffee",nameAr:"قهوة حبشة",description:"Ethiopian-style spiced coffee",price:12}]},
    { name:"Makkah Grand Shawarma", nameAr:"شاورما مكة الكبرى", cuisineTag:"Shawarma · Quick · Halal", heroEmoji:"🥙", ratingAvg:4.6, etaMinsLow:10, etaMinsHigh:20,
      items:[{category:"mains",name:"Chicken Shawarma",nameAr:"شاورما دجاج",description:"Garlic sauce, fries, pickles",price:14},{category:"mains",name:"Meat Shawarma",nameAr:"شاورما لحم",description:"Beef & lamb mix",price:18},{category:"drinks",name:"Fresh Orange Juice",nameAr:"عصير برتقال طازج",description:"Cold pressed",price:10}]},
    { name:"Fatatri Al Haram", nameAr:"فطاطري الحرم", cuisineTag:"Egyptian · Fateer · Pastry", heroEmoji:"🥧", ratingAvg:4.5, etaMinsLow:15, etaMinsHigh:25,
      items:[{category:"mains",name:"Fateer Meshaltet",nameAr:"فطير مشلتت",description:"Multi-layered buttery pastry",price:18},{category:"mains",name:"Fateer with Minced Meat",nameAr:"فطير باللحمة",description:"Spiced minced meat filled pastry",price:25},{category:"desserts",name:"Fateer with Honey",nameAr:"فطير بالعسل",description:"With pure honey & cream",price:20}]},
    { name:"Kudu Mecca", nameAr:"كودو مكة", cuisineTag:"Burgers · Sandwiches · Saudi Fast Food", heroEmoji:"🍔", ratingAvg:4.3, etaMinsLow:15, etaMinsHigh:25,
      items:[{category:"mains",name:"Double Kudu Burger",nameAr:"دبل كودو برغر",description:"Two beef patties, cheese",price:32},{category:"mains",name:"Zinger Chicken",nameAr:"زنغر دجاج",description:"Spicy crispy chicken sandwich",price:26},{category:"sides",name:"Cheese Sticks",nameAr:"عيدان الجبن",description:"Mozzarella sticks, marinara",price:16}]},
  ]);

  await seedCity("Medina", "Saudi Arabia", "SAR", [
    { name:"Bab Al Aqeer Restaurant", nameAr:"مطعم باب العقير", cuisineTag:"Medinese · Traditional · Halal", heroEmoji:"🌹", ratingAvg:4.8, etaMinsLow:20, etaMinsHigh:35, lat:24.5247, lng:39.5692,
      items:[{category:"mains",name:"Madinah Saleeg",nameAr:"سليق المدينة",description:"Creamy rice cooked in broth, chicken",price:38},{category:"mains",name:"Hejazi Kabsa",nameAr:"كبسة حجازية",description:"Whole chicken, Hejazi spices",price:52},{category:"sides",name:"Medinah Dates Platter",nameAr:"طبق تمور المدينة",description:"Ajwa, Amber, Medjool",price:28}]},
    { name:"Al Noor Gate Grill", nameAr:"مشاوي باب النور", cuisineTag:"Grills · Saudi · Family", heroEmoji:"🔥", ratingAvg:4.6, etaMinsLow:25, etaMinsHigh:40,
      items:[{category:"mains",name:"Mixed Grill Platter",nameAr:"مشاوي مشكلة",description:"Kofta, shish, chicken",price:68},{category:"mains",name:"Lamb Chops",nameAr:"ريش لحم",description:"Marinated, charcoal-grilled",price:82},{category:"sides",name:"Freekeh Soup",nameAr:"شوربة فريكة",description:"Roasted green wheat soup",price:15}]},
    { name:"Ajyad Seafood Medina", nameAr:"أجياد للمأكولات البحرية المدينة", cuisineTag:"Seafood · Fish · Grills", heroEmoji:"🦞", ratingAvg:4.7, etaMinsLow:25, etaMinsHigh:40,
      items:[{category:"mains",name:"Grilled Hammour",nameAr:"هامور مشوي",description:"Red Sea grouper, herbs",price:78},{category:"mains",name:"Prawn Kabsa",nameAr:"كبسة روبيان",description:"Prawn with spiced rice",price:65},{category:"drinks",name:"Tamarind Lemonade",nameAr:"ليمون تمر هندي",description:"Tamarind, mint, lemon",price:12}]},
  ]);

  await seedCity("Dammam", "Saudi Arabia", "SAR", [
    { name:"Al Afrah Restaurant Dammam", nameAr:"مطعم الأفراح الدمام", cuisineTag:"Eastern Saudi · Grills · Family", heroEmoji:"🎊", ratingAvg:4.7, etaMinsLow:20, etaMinsHigh:35, lat:26.4207, lng:50.0888,
      items:[{category:"mains",name:"Kabsa Dagga",nameAr:"كبسة دقة",description:"Saudi rice with tomato dagga sauce",price:45},{category:"mains",name:"Shrimp Kabsa",nameAr:"كبسة روبيان",description:"Gulf shrimp with spiced rice",price:58},{category:"sides",name:"Tomato Dagga Salad",nameAr:"سلطة دقة طماطم",description:"Tomato, chili, dried lime",price:12}]},
    { name:"Costa Coffee Dammam", nameAr:"كوستا كوفي الدمام", cuisineTag:"Coffee · Pastries · Sandwiches", heroEmoji:"☕", ratingAvg:4.3, etaMinsLow:15, etaMinsHigh:25,
      items:[{category:"drinks",name:"Flat White",nameAr:"فلات وايت",description:"Double espresso, microfoam",price:18},{category:"drinks",name:"Iced Caramel Latte",nameAr:"لاتيه كراميل مثلج",description:"Cold espresso, caramel syrup",price:22},{category:"sides",name:"Almond Croissant",nameAr:"كرواسون لوز",description:"Frangipane-filled pastry",price:15}]},
    { name:"Fish Market Dammam", nameAr:"سوق السمك الدمام", cuisineTag:"Seafood · Gulf · Live Fish", heroEmoji:"🐡", ratingAvg:4.8, etaMinsLow:25, etaMinsHigh:40,
      items:[{category:"mains",name:"Pick Your Fish",nameAr:"اختر سمكك",description:"Fresh Gulf fish, choose your cooking style",price:95},{category:"sides",name:"Garlic Rice",nameAr:"أرز بالثوم",description:"Fragrant fried rice",price:12},{category:"sides",name:"Fried Calamari",nameAr:"كاليماري مقلي",description:"Crispy, lemon, tartare",price:28}]},
    { name:"McDonald's Dammam", nameAr:"ماكدونالدز الدمام", cuisineTag:"Burgers · Breakfast · McFlurry", heroEmoji:"🍟", ratingAvg:4.1, etaMinsLow:15, etaMinsHigh:25,
      items:[{category:"mains",name:"Quarter Pounder Deluxe",nameAr:"ربع باوند ديلوكس",description:"Beef patty, lettuce, tomato",price:29},{category:"mains",name:"McArabia Chicken",nameAr:"المك عربيا دجاج",description:"Grilled chicken, Arabic bread",price:24},{category:"drinks",name:"McFlurry Oreo",nameAr:"ماك فلوري أوريو",description:"Vanilla with Oreo",price:14}]},
  ]);

  await seedCity("Al Khobar", "Saudi Arabia", "SAR", [
    { name:"Luay Al Khobari", nameAr:"لواء الخبراوي", cuisineTag:"Eastern Saudi · Kabsa · Traditional", heroEmoji:"🏠", ratingAvg:4.7, etaMinsLow:20, etaMinsHigh:35, lat:26.2172, lng:50.1971,
      items:[{category:"mains",name:"Chicken Kabsa",nameAr:"كبسة دجاج",description:"Eastern Province style, dried lime",price:38},{category:"mains",name:"Lamb Ouzi",nameAr:"أوزي لحم",description:"Slow-roasted lamb, fragrant rice",price:65},{category:"sides",name:"Salata Dakka",nameAr:"سلطة دقة",description:"Tomato, chili, dried lime, coriander",price:10}]},
    { name:"Khobar Corniche Grill", nameAr:"مشاوي كورنيش الخبر", cuisineTag:"Grills · Seafood · Gulf", heroEmoji:"🌊", ratingAvg:4.6, etaMinsLow:25, etaMinsHigh:40,
      items:[{category:"mains",name:"Mixed Seafood Grill",nameAr:"مشاوي بحرية مشكلة",description:"Hammour, prawns, calamari",price:115},{category:"mains",name:"Lobster Grilled",nameAr:"لوبستر مشوي",description:"Garlic butter, lemon",price:185},{category:"sides",name:"Salad Bar",nameAr:"بار السلطات",description:"Fresh garden salad selection",price:18}]},
    { name:"Red Lobster Khobar", nameAr:"ريد لوبستر الخبر", cuisineTag:"American Seafood · Lobster", heroEmoji:"🦞", ratingAvg:4.5, etaMinsLow:25, etaMinsHigh:40,
      items:[{category:"mains",name:"Endless Shrimp",nameAr:"روبيان لا نهائي",description:"Garlic, scampi, or breaded",price:85},{category:"mains",name:"Admiral's Feast",nameAr:"وليمة الأدميرال",description:"Shrimp, scallops, fish, crab",price:125},{category:"sides",name:"Cheddar Bay Biscuits",nameAr:"بسكويت تشيدر باي",description:"Warm garlic herb biscuits",price:18}]},
  ]);

  await seedCity("Abha", "Saudi Arabia", "SAR", [
    { name:"Al Bait Al Aseer", nameAr:"البيت العسيري", cuisineTag:"Asiri · Traditional · Mountain", heroEmoji:"🏔️", ratingAvg:4.9, etaMinsLow:25, etaMinsHigh:40, lat:18.2164, lng:42.5053,
      items:[{category:"mains",name:"Lamb Haneeth Asiri",nameAr:"هنيث عسيري",description:"Clay pot slow-roasted lamb, Abha style",price:68},{category:"mains",name:"Asiri Honey Bread",nameAr:"خبز عسير بالعسل",description:"Mountain bread with Abha honey",price:22},{category:"drinks",name:"Qahwa Khawlani",nameAr:"قهوة خولاني",description:"Asiri coffee with ginger",price:10}]},
    { name:"Green Mountain Grill", nameAr:"مشاوي الجبل الأخضر", cuisineTag:"Grills · Asiri · Family", heroEmoji:"🌿", ratingAvg:4.6, etaMinsLow:20, etaMinsHigh:35,
      items:[{category:"mains",name:"Mixed Grill",nameAr:"مشاوي مشكلة",description:"Kofta, shish, chicken wings",price:58},{category:"mains",name:"Grilled Trout",nameAr:"سمك التراوت المشوي",description:"Mountain stream trout, herbs",price:65},{category:"sides",name:"Assiri Flatbread",nameAr:"خبز العسيري",description:"Thin traditional bread",price:5}]},
  ]);

  await seedCity("Taif", "Saudi Arabia", "SAR", [
    { name:"Rose City Grill", nameAr:"مشاوي مدينة الورد", cuisineTag:"Grills · Taifi · Family", heroEmoji:"🌹", ratingAvg:4.7, etaMinsLow:20, etaMinsHigh:35, lat:21.2854, lng:40.4152,
      items:[{category:"mains",name:"Grilled Lamb Chops",nameAr:"ريش لحم مشوية",description:"Taif style, mountain herbs",price:75},{category:"mains",name:"Chicken Ouzi",nameAr:"أوزي دجاج",description:"Whole chicken, fragrant rice",price:48},{category:"sides",name:"Taifi Honey Dip",nameAr:"عسل الطائف",description:"Pure sidr honey for dipping",price:18}]},
    { name:"Taif Palace Kabsa", nameAr:"كبسة قصر الطائف", cuisineTag:"Saudi · Kabsa · Traditional", heroEmoji:"🍚", ratingAvg:4.8, etaMinsLow:25, etaMinsHigh:40,
      items:[{category:"mains",name:"Lamb Kabsa",nameAr:"كبسة لحم",description:"Mountain lamb, Taifi spices",price:55},{category:"mains",name:"Chicken Mandi",nameAr:"مندي دجاج",description:"Taif-style slow roasted",price:38},{category:"drinks",name:"Rose Water Lemonade",nameAr:"ليمون بماء الورد",description:"Taif rose water, fresh lemon",price:12}]},
  ]);

  await seedCity("Tabuk", "Saudi Arabia", "SAR", [
    { name:"Al Tabuk Traditional", nameAr:"التقليدي تبوك", cuisineTag:"Tabuki · Grills · Local", heroEmoji:"🏜️", ratingAvg:4.6, etaMinsLow:20, etaMinsHigh:35, lat:28.3835, lng:36.5662,
      items:[{category:"mains",name:"Chicken Kabsa Tabuki",nameAr:"كبسة دجاج تبوكية",description:"Northern Saudi style kabsa",price:38},{category:"mains",name:"Grilled Lamb",nameAr:"لحم ضأن مشوي",description:"Desert lamb, charcoal grilled",price:65},{category:"drinks",name:"Arabic Qahwa",nameAr:"قهوة عربية",description:"Cardamom & saffron coffee",price:8}]},
  ]);

  await seedCity("Najran", "Saudi Arabia", "SAR", [
    { name:"Old Najran House", nameAr:"بيت نجران القديم", cuisineTag:"Najrani · Traditional · Cultural", heroEmoji:"🏛️", ratingAvg:4.8, etaMinsLow:25, etaMinsHigh:40, lat:17.4927, lng:44.1277,
      items:[{category:"mains",name:"Najrani Asida",nameAr:"عصيدة نجرانية",description:"Thick wheat porridge with ghee",price:22},{category:"mains",name:"Lamb Haneeth",nameAr:"هنيث لحم",description:"Yemeni-influenced slow roast",price:68},{category:"drinks",name:"Najrani Gishr",nameAr:"قشر نجراني",description:"Coffee husk drink with ginger",price:8}]},
  ]);

  // ╔══════════════════════════════════════════════════════════╗
  // ║  KUWAIT                                                  ║
  // ╚══════════════════════════════════════════════════════════╝
  console.log("🇰🇼 Kuwait");
  await seedCity("Kuwait City", "Kuwait", "KWD", [
    { name:"Freej Swaileh", nameAr:"فريج صويلح", cuisineTag:"Kuwaiti · Traditional · Heritage", heroEmoji:"🫕", ratingAvg:4.9, etaMinsLow:30, etaMinsHigh:45, lat:29.3697, lng:47.9783,
      items:[{category:"mains",name:"Machboos Laham",nameAr:"مجبوس لحم",description:"Kuwaiti spiced rice with lamb",price:4.5},{category:"mains",name:"Harees",nameAr:"هريس",description:"Wheat & lamb slow porridge",price:3.2},{category:"mains",name:"Muhammar",nameAr:"محمر",description:"Sweet saffron rice",price:2.8},{category:"sides",name:"Salona Samak",nameAr:"صالونة سمك",description:"Spiced fish stew",price:3.5}]},
    { name:"Slider Station Kuwait", nameAr:"سليدر ستيشن الكويت", cuisineTag:"Burgers · Sliders · Trendy", heroEmoji:"🍔", ratingAvg:4.6, etaMinsLow:20, etaMinsHigh:35,
      items:[{category:"mains",name:"Classic Beef Slider ×3",nameAr:"سليدر لحم ×3",description:"Pickles, American cheese, sauce",price:3.8},{category:"mains",name:"Spicy Chicken Sandwich",nameAr:"ساندويش دجاج حار",description:"Crispy chicken, jalapeño slaw",price:2.9},{category:"sides",name:"Truffle Fries",nameAr:"بطاطس ترافل",description:"Parmesan, truffle oil",price:1.8}]},
    { name:"Mais Alghanim Kuwait", nameAr:"ميس الغانم الكويت", cuisineTag:"Lebanese · Seafood · Fine Dining", heroEmoji:"🌟", ratingAvg:4.8, etaMinsLow:30, etaMinsHigh:50,
      items:[{category:"mains",name:"Whole Grilled Hammour",nameAr:"هامور مشوي كامل",description:"Fresh Gulf grouper, herbs",price:8.5},{category:"mains",name:"Mezze Platter",nameAr:"طبق مازة",description:"Hummus, mutabal, tabbouleh, kibbeh",price:5.2},{category:"drinks",name:"Fresh Pomegranate",nameAr:"عصير رمان طازج",description:"Cold pressed pomegranate juice",price:2.2}]},
    { name:"Kout Fish & Chips Kuwait", nameAr:"كاوت فيش وشيبس الكويت", cuisineTag:"British · Seafood · Casual", heroEmoji:"🐟", ratingAvg:4.5, etaMinsLow:20, etaMinsHigh:30,
      items:[{category:"mains",name:"Fish & Chips",nameAr:"فيش وشيبس",description:"Beer-battered cod, mushy peas",price:3.5},{category:"mains",name:"Prawn Basket",nameAr:"سلة روبيان",description:"Crispy prawns, cocktail sauce",price:4.2},{category:"sides",name:"Onion Rings",nameAr:"حلقات البصل",description:"Hand-battered",price:1.5}]},
    { name:"Al Boom Floating Restaurant", nameAr:"مطعم البوم العائم", cuisineTag:"Kuwaiti · Gulf · Seafood", heroEmoji:"⛵", ratingAvg:4.7, etaMinsLow:25, etaMinsHigh:45,
      items:[{category:"mains",name:"Grilled Zubaidee",nameAr:"زبيدي مشوي",description:"Silver pomfret, Gulf style",price:5.5},{category:"mains",name:"Fried Hamour",nameAr:"هامور مقلي",description:"Crispy fried grouper",price:6.2},{category:"drinks",name:"Fresh Lemon Mint",nameAr:"ليمون نعناع طازج",description:"Refreshing Gulf drink",price:1.5}]},
    { name:"Automatic Restaurant Kuwait", nameAr:"مطعم أوتوماتيك الكويت", cuisineTag:"Lebanese · Street Food", heroEmoji:"🧆", ratingAvg:4.6, etaMinsLow:15, etaMinsHigh:25,
      items:[{category:"mains",name:"Shawarma Wrap",nameAr:"رول شاورما",description:"Chicken or meat, garlic sauce",price:1.2},{category:"sides",name:"Fattoush Salad",nameAr:"سلطة فتوش",description:"Crispy bread, sumac dressing",price:1.8},{category:"drinks",name:"Jallab",nameAr:"جلاب",description:"Grape juice, rose water",price:1.0}]},
  ]);

  await seedCity("Salmiya", "Kuwait", "KWD", [
    { name:"Marina Waves Salmiya", nameAr:"أمواج المارينا السالمية", cuisineTag:"Seafood · International · View", heroEmoji:"🌊", ratingAvg:4.7, etaMinsLow:25, etaMinsHigh:40, lat:29.3399, lng:48.0762,
      items:[{category:"mains",name:"Seafood Pasta",nameAr:"باستا المأكولات البحرية",description:"Shrimp, calamari, cream sauce",price:5.5},{category:"mains",name:"Grilled Sea Bream",nameAr:"دنيس مشوي",description:"With herbs and lemon butter",price:7.2},{category:"sides",name:"Calamari Fritti",nameAr:"كاليماري فريتي",description:"Lemon, aioli dip",price:3.5}]},
    { name:"Chilis Salmiya", nameAr:"تشيليز السالمية", cuisineTag:"American · Tex-Mex · Burgers", heroEmoji:"🌮", ratingAvg:4.3, etaMinsLow:20, etaMinsHigh:35,
      items:[{category:"mains",name:"Baby Back Ribs",nameAr:"ضلوع بيبي باك",description:"Slow-roasted, smoky BBQ",price:7.5},{category:"mains",name:"Triple Dipper",nameAr:"ثلاثي الغموس",description:"Egg rolls, quesadillas, wings",price:5.5},{category:"drinks",name:"Presidente Margarita (NA)",nameAr:"ماركاريتا بريزيدينت (بدون كحول)",description:"Non-alcoholic margarita",price:2.2}]},
    { name:"Sultan Kuwaiti Cuisine", nameAr:"سلطان المطبخ الكويتي", cuisineTag:"Kuwaiti · Traditional · Family", heroEmoji:"👑", ratingAvg:4.8, etaMinsLow:25, etaMinsHigh:40,
      items:[{category:"mains",name:"Djaj Bil Timman",nameAr:"دجاج بالتمن",description:"Kuwaiti chicken on saffron rice",price:4.2},{category:"mains",name:"Tashreeb",nameAr:"تشريب",description:"Bread soaked in meat broth",price:3.8},{category:"sides",name:"Daqoos Sauce",nameAr:"دقوس",description:"Kuwaiti tomato & chili dip",price:0.8}]},
  ]);

  await seedCity("Hawalli", "Kuwait", "KWD", [
    { name:"Al Fannar Hawalli", nameAr:"الفنار حولي", cuisineTag:"Lebanese · Grills · Mezze", heroEmoji:"🌿", ratingAvg:4.6, etaMinsLow:20, etaMinsHigh:35, lat:29.3372, lng:48.0288,
      items:[{category:"mains",name:"Kafta Platter",nameAr:"طبق كفتة",description:"Grilled minced lamb, rice, salad",price:4.2},{category:"mains",name:"Mixed Grill",nameAr:"مشاوي مشكلة",description:"Chicken, lamb, kofta",price:6.5},{category:"sides",name:"Hummus Beiruti",nameAr:"حمص بيروتي",description:"Creamy, olive oil, paprika",price:1.8}]},
    { name:"Subway Hawalli", nameAr:"صب واي حولي", cuisineTag:"Sandwiches · Healthy · Quick", heroEmoji:"🥗", ratingAvg:4.0, etaMinsLow:10, etaMinsHigh:20,
      items:[{category:"mains",name:"Chicken Teriyaki",nameAr:"دجاج تيرياكي",description:"Teriyaki sauce, fresh veggies",price:1.8},{category:"mains",name:"Tuna Sub",nameAr:"ساب تونة",description:"Tuna salad, cucumber, olive",price:1.6},{category:"sides",name:"Chocolate Chip Cookie",nameAr:"كوكيز شوكولاتة",description:"Freshly baked",price:0.5}]},
  ]);

  await seedCity("Farwaniya", "Kuwait", "KWD", [
    { name:"South Indian Kitchen Farwaniya", nameAr:"مطبخ جنوب الهند الفروانية", cuisineTag:"Indian · South Indian · Kerala", heroEmoji:"🍛", ratingAvg:4.7, etaMinsLow:20, etaMinsHigh:35, lat:29.2768, lng:47.9596,
      items:[{category:"mains",name:"Kerala Fish Curry",nameAr:"كاري سمك كيرالا",description:"Coconut milk, kudampuli, green chili",price:2.8},{category:"mains",name:"Chicken Biryani",nameAr:"برياني دجاج",description:"Kerala-style dum biryani",price:2.5},{category:"sides",name:"Parotta",nameAr:"باروتا",description:"Layered flatbread",price:0.5}]},
    { name:"Burger Boutique Farwaniya", nameAr:"برغر بوتيك الفروانية", cuisineTag:"Gourmet Burgers · Milkshakes", heroEmoji:"🍔", ratingAvg:4.5, etaMinsLow:20, etaMinsHigh:30,
      items:[{category:"mains",name:"Black & White Burger",nameAr:"برغر أبيض وأسود",description:"Black bun, truffle mayo, aged cheddar",price:3.8},{category:"mains",name:"Crispy Chicken Burger",nameAr:"برغر دجاج كريسبي",description:"Pickle-brined chicken, coleslaw",price:3.2},{category:"desserts",name:"Oreo Milkshake",nameAr:"ميلك شيك أوريو",description:"Thick and creamy",price:2.0}]},
  ]);

  await seedCity("Ahmadi", "Kuwait", "KWD", [
    { name:"Shisha Palace Ahmadi", nameAr:"قصر الشيشة الأحمدي", cuisineTag:"Arabic · Grills · Café", heroEmoji:"🌙", ratingAvg:4.5, etaMinsLow:20, etaMinsHigh:35, lat:29.0769, lng:48.0838,
      items:[{category:"mains",name:"Mixed Grill",nameAr:"مشاوي مشكلة",description:"Lamb, chicken, kofta",price:5.5},{category:"drinks",name:"Karak Chai",nameAr:"كرك",description:"Spiced milk tea",price:0.6},{category:"sides",name:"Pita & Dips",nameAr:"خبز مع الغموسات",description:"Hummus, mutabal",price:1.5}]},
  ]);

  await seedCity("Jahra", "Kuwait", "KWD", [
    { name:"Desert Grill Jahra", nameAr:"مشاوي الصحراء الجهراء", cuisineTag:"Kuwaiti · Grills · Outdoor", heroEmoji:"🏜️", ratingAvg:4.6, etaMinsLow:25, etaMinsHigh:40, lat:29.3378, lng:47.6581,
      items:[{category:"mains",name:"Ouzi",nameAr:"أوزي",description:"Whole roasted lamb on rice",price:6.5},{category:"mains",name:"Tikka Mix",nameAr:"تيكا مشكلة",description:"Marinated chicken and lamb",price:4.5},{category:"sides",name:"Salona",nameAr:"صالونة",description:"Kuwaiti vegetable stew",price:1.8}]},
  ]);

  // ╔══════════════════════════════════════════════════════════╗
  // ║  QATAR                                                   ║
  // ╚══════════════════════════════════════════════════════════╝
  console.log("🇶🇦 Qatar");
  await seedCity("Doha", "Qatar", "QAR", [
    { name:"Parisa Doha", nameAr:"باريسا الدوحة", cuisineTag:"Iranian · Persian · Grills", heroEmoji:"🧆", ratingAvg:4.8, etaMinsLow:25, etaMinsHigh:40, lat:25.2854, lng:51.5310,
      items:[{category:"mains",name:"Koobideh Kebab",nameAr:"كباب كوبيده",description:"Minced lamb & beef skewer",price:52},{category:"mains",name:"Ghormeh Sabzi",nameAr:"قورمه سبزي",description:"Persian herb stew, lamb",price:58},{category:"drinks",name:"Doogh",nameAr:"دوغ",description:"Yoghurt mint sparkling",price:14}]},
    { name:"Operation Falafel Doha", nameAr:"عملية فلافل الدوحة", cuisineTag:"Falafel · Wraps · Levantine", heroEmoji:"🧇", ratingAvg:4.7, etaMinsLow:15, etaMinsHigh:25,
      items:[{category:"mains",name:"Falafel Wrap",nameAr:"رول فلافل",description:"Tahini, pickles, vegetables",price:28},{category:"mains",name:"Hummus Plate",nameAr:"طبق حمص",description:"Olive oil, paprika",price:22},{category:"sides",name:"Cheese Sambousek ×4",nameAr:"سمبوسك جبنة",description:"Crispy, akkawi cheese",price:18}]},
    { name:"Al Shami Syrian Doha", nameAr:"الشامي السوري الدوحة", cuisineTag:"Syrian · Grills · Mezze", heroEmoji:"🌿", ratingAvg:4.8, etaMinsLow:20, etaMinsHigh:35,
      items:[{category:"mains",name:"Kibbeh Bil Saniyeh",nameAr:"كبة بالصينية",description:"Baked bulgur & lamb",price:35},{category:"mains",name:"Chicken Shawarma Plate",nameAr:"طبق شاورما دجاج",description:"Garlic sauce, pickles, fries",price:38},{category:"sides",name:"Muhammara",nameAr:"محمرة",description:"Roasted red pepper, walnut dip",price:18}]},
    { name:"Nobu Doha", nameAr:"نوبو الدوحة", cuisineTag:"Japanese Fusion · Sushi · Omakase", heroEmoji:"🍣", ratingAvg:4.9, etaMinsLow:40, etaMinsHigh:60,
      items:[{category:"mains",name:"Black Cod Miso",nameAr:"سمك كود مع ميسو أسود",description:"Signature Nobu dish",price:185},{category:"mains",name:"Yellowtail Jalapeño",nameAr:"ييلو تيل بالخالبينو",description:"Sashimi with jalapeño, ponzu",price:95},{category:"sides",name:"Edamame",nameAr:"إيداماميه",description:"Salted steamed soybeans",price:35}]},
    { name:"Spice Route Doha", nameAr:"طريق التوابل الدوحة", cuisineTag:"Indian · Curry · Tandoor", heroEmoji:"🌶️", ratingAvg:4.6, etaMinsLow:25, etaMinsHigh:40,
      items:[{category:"mains",name:"Chicken Tikka Masala",nameAr:"دجاج تيكا ماسالا",description:"Marinated chicken, spiced tomato cream",price:55},{category:"mains",name:"Dal Makhani",nameAr:"دال ماكاني",description:"Black lentil, butter, fenugreek",price:35},{category:"sides",name:"Butter Naan",nameAr:"خبز نان بالزبدة",description:"Tandoor-baked with butter",price:10}]},
    { name:"The Pearl Lebanese Doha", nameAr:"اللبنانية ذا بيرل الدوحة", cuisineTag:"Lebanese · Seafood · Fine", heroEmoji:"🐚", ratingAvg:4.7, etaMinsLow:25, etaMinsHigh:40,
      items:[{category:"mains",name:"Sayadieh",nameAr:"صيادية",description:"Fish over caramelized onion rice",price:62},{category:"sides",name:"Mixed Cold Mezze",nameAr:"مازة بارد مشكلة",description:"Hummus, tabbouleh, kibbeh nayyeh",price:45},{category:"drinks",name:"Freshly Squeezed OJ",nameAr:"عصير برتقال طازج",description:"Cold pressed, no sugar",price:18}]},
    { name:"Burger Lab Doha", nameAr:"برغر لاب الدوحة", cuisineTag:"Gourmet Burgers · Creative", heroEmoji:"🔬", ratingAvg:4.5, etaMinsLow:20, etaMinsHigh:30,
      items:[{category:"mains",name:"Science Burger",nameAr:"برغر ساينس",description:"Liquid nitrogen bun, wagyu beef",price:75},{category:"mains",name:"Mushroom Truffle Burger",nameAr:"برغر ترافل فطر",description:"Wild mushroom, truffle mayo",price:62},{category:"sides",name:"Smoked Fries",nameAr:"بطاطس مدخنة",description:"Hickory-smoked, sea salt",price:22}]},
  ]);

  await seedCity("Al Rayyan", "Qatar", "QAR", [
    { name:"Lusail Stadium Grill", nameAr:"مشاوي ملعب لوسيل", cuisineTag:"International · Grills · Stadium", heroEmoji:"🏟️", ratingAvg:4.5, etaMinsLow:20, etaMinsHigh:35, lat:25.2568, lng:51.4311,
      items:[{category:"mains",name:"Mixed Grill Platter",nameAr:"مشاوي مشكلة",description:"Beef, chicken, lamb, kofta",price:68},{category:"mains",name:"Chicken Caesar Salad",nameAr:"سلطة سيزر دجاج",description:"Romaine, croutons, Caesar dressing",price:42},{category:"drinks",name:"Fresh Lemon Mint",nameAr:"ليمون نعناع",description:"Refreshing drink",price:18}]},
    { name:"Al Rayyan Traditional", nameAr:"الريان التقليدي", cuisineTag:"Qatari · Traditional · Local", heroEmoji:"🏘️", ratingAvg:4.8, etaMinsLow:25, etaMinsHigh:40,
      items:[{category:"mains",name:"Machboos Dajaj",nameAr:"مجبوس دجاج",description:"Qatari spiced chicken rice",price:45},{category:"mains",name:"Harees",nameAr:"هريس",description:"Wheat and lamb porridge",price:32},{category:"sides",name:"Salona Khudar",nameAr:"صالونة خضار",description:"Vegetable stew, baharat spices",price:18}]},
  ]);

  await seedCity("Al Wakrah", "Qatar", "QAR", [
    { name:"Old Fishermen's Wharf", nameAr:"رصيف الصيادين القدامى", cuisineTag:"Qatari Seafood · Fresh Fish", heroEmoji:"⚓", ratingAvg:4.7, etaMinsLow:25, etaMinsHigh:40, lat:25.1656, lng:51.6031,
      items:[{category:"mains",name:"Grilled Safi",nameAr:"سافي مشوي",description:"Fresh parrotfish, Qatari spices",price:58},{category:"mains",name:"Murabyan Prawn Rice",nameAr:"أرز مربيان",description:"Traditional Gulf prawn rice",price:65},{category:"drinks",name:"Qahwa Qatariya",nameAr:"قهوة قطرية",description:"Cardamom, saffron, rose water",price:10}]},
  ]);

  await seedCity("Lusail", "Qatar", "QAR", [
    { name:"Lusail Marina Dining", nameAr:"مطاعم مارينا لوسيل", cuisineTag:"International · Waterfront", heroEmoji:"⛵", ratingAvg:4.6, etaMinsLow:25, etaMinsHigh:45, lat:25.4231, lng:51.4897,
      items:[{category:"mains",name:"Grilled Salmon",nameAr:"سالمون مشوي",description:"Norwegian salmon, caper butter",price:85},{category:"mains",name:"Wagyu Burger",nameAr:"واغيو برغر",description:"Japanese wagyu, brioche bun",price:95},{category:"sides",name:"Truffle Mac & Cheese",nameAr:"ماك وتشيز ترافل",description:"Four cheese, truffle oil",price:42}]},
  ]);

  // ╔══════════════════════════════════════════════════════════╗
  // ║  JORDAN                                                  ║
  // ╚══════════════════════════════════════════════════════════╝
  console.log("🇯🇴 Jordan");
  await seedCity("Amman", "Jordan", "JOD", [
    { name:"Hashem Restaurant", nameAr:"مطعم هاشم", cuisineTag:"Jordanian · Foul · Falafel · Icon", heroEmoji:"🫘", ratingAvg:5.0, etaMinsLow:15, etaMinsHigh:25, lat:31.9554, lng:35.9234,
      items:[{category:"mains",name:"Foul & Falafel Plate",nameAr:"طبق فول وفلافل",description:"Amman's iconic breakfast",price:1.8},{category:"mains",name:"Mansaf Bowl",nameAr:"وعاء منسف",description:"Lamb in jameed, rice",price:4.5},{category:"drinks",name:"Sahlab",nameAr:"سحلب",description:"Warm orchid milk, cinnamon",price:1.2}]},
    { name:"Sufra Amman", nameAr:"سفرة عمّان", cuisineTag:"Jordanian · Traditional · Heritage", heroEmoji:"🏺", ratingAvg:4.8, etaMinsLow:25, etaMinsHigh:40,
      items:[{category:"mains",name:"Mansaf",nameAr:"منسف",description:"Jordan's national dish, jameed yoghurt",price:5.5},{category:"mains",name:"Maqluba",nameAr:"مقلوبة",description:"Upside-down rice, chicken, vegetables",price:4.2},{category:"sides",name:"Fattoush",nameAr:"فتوش",description:"Crispy bread salad",price:1.5},{category:"drinks",name:"Tamarind",nameAr:"تمر هندي",description:"Sweet sour tamarind drink",price:0.8}]},
    { name:"Books@Cafe Amman", nameAr:"بوكس كافيه عمّان", cuisineTag:"Café · Fusion · Brunch", heroEmoji:"📚", ratingAvg:4.6, etaMinsLow:20, etaMinsHigh:35,
      items:[{category:"mains",name:"Eggs Benedict",nameAr:"بيض بنديكت",description:"Poached eggs, hollandaise",price:5.5},{category:"mains",name:"Shakshuka",nameAr:"شكشوكة",description:"Eggs in spiced tomato sauce",price:4.2},{category:"drinks",name:"Cardamom Latte",nameAr:"لاتيه هيل",description:"Espresso, steamed milk",price:2.8}]},
    { name:"Fakhr El-Din Amman", nameAr:"فخر الدين عمّان", cuisineTag:"Lebanese Fine Dining · Mezze", heroEmoji:"🌟", ratingAvg:4.9, etaMinsLow:30, etaMinsHigh:50,
      items:[{category:"mains",name:"Kibbeh Nayyeh",nameAr:"كبة نيئة",description:"Raw lamb, bulgur, pine nuts",price:6.5},{category:"mains",name:"Grilled Meat Platter",nameAr:"طبق مشاوي",description:"Lamb chops, chicken, kofta",price:8.5},{category:"sides",name:"Cold Mezze Selection",nameAr:"مازة بارد مختار",description:"Six cold dishes",price:5.5}]},
    { name:"Falafel Al-Quds Amman", nameAr:"فلافل القدس عمّان", cuisineTag:"Street Food · Falafel · Quick", heroEmoji:"🧆", ratingAvg:4.7, etaMinsLow:10, etaMinsHigh:20,
      items:[{category:"mains",name:"Falafel Sandwich",nameAr:"ساندويش فلافل",description:"Fresh falafel, vegetables, tahini",price:0.8},{category:"mains",name:"Falafel Plate",nameAr:"طبق فلافل",description:"With hummus, tomato, onion",price:2.0},{category:"drinks",name:"Fresh Lemon Juice",nameAr:"عصير ليمون طازج",description:"Cold pressed with mint",price:0.6}]},
    { name:"Tannoureen Amman", nameAr:"تنورين عمّان", cuisineTag:"Lebanese · Grills · Mezza", heroEmoji:"🌲", ratingAvg:4.7, etaMinsLow:25, etaMinsHigh:40,
      items:[{category:"mains",name:"Mixed Grill",nameAr:"مشاوي مشكلة",description:"Shish, kafta, chicken",price:7.5},{category:"mains",name:"Arayes",nameAr:"عرايس",description:"Grilled bread stuffed with meat",price:3.5},{category:"sides",name:"Moutabal",nameAr:"متبل",description:"Roasted aubergine, tahini",price:2.2}]},
    { name:"Romero's Amman", nameAr:"روميروز عمّان", cuisineTag:"Italian · Pizza · Pasta", heroEmoji:"🍝", ratingAvg:4.5, etaMinsLow:25, etaMinsHigh:40,
      items:[{category:"mains",name:"Seafood Risotto",nameAr:"ريزوتو المأكولات البحرية",description:"Prawns, calamari, white wine",price:7.8},{category:"mains",name:"Quattro Stagioni Pizza",nameAr:"بيتزا كواترو ستاجيوني",description:"Four-seasons pizza",price:6.5},{category:"desserts",name:"Panna Cotta",nameAr:"بانا كوتا",description:"Vanilla, berry compote",price:3.2}]},
  ]);

  await seedCity("Zarqa", "Jordan", "JOD", [
    { name:"Al Zarqa Traditional", nameAr:"الزرقاء التقليدي", cuisineTag:"Jordanian · Grills · Family", heroEmoji:"🍖", ratingAvg:4.5, etaMinsLow:20, etaMinsHigh:35, lat:32.0728, lng:36.0879,
      items:[{category:"mains",name:"Chicken Mansaf",nameAr:"منسف دجاج",description:"Chicken in jameed sauce, rice",price:4.2},{category:"mains",name:"Grilled Chicken",nameAr:"دجاج مشوي",description:"Half chicken, grilled herbs",price:3.5},{category:"sides",name:"Hummus",nameAr:"حمص",description:"Olive oil, lemon",price:0.8}]},
    { name:"Syrian Sweets Zarqa", nameAr:"حلوى سورية الزرقاء", cuisineTag:"Sweets · Baklava · Knafeh", heroEmoji:"🍯", ratingAvg:4.7, etaMinsLow:15, etaMinsHigh:25,
      items:[{category:"desserts",name:"Knafeh Nabulsiyeh",nameAr:"كنافة نابلسية",description:"Hot cheese, sugar syrup, pistachios",price:1.8},{category:"desserts",name:"Baklava Tray",nameAr:"صينية بقلاوة",description:"Mixed nut baklava",price:3.5},{category:"drinks",name:"Arabic Coffee",nameAr:"قهوة عربية",description:"Cardamom, lightly roasted",price:0.5}]},
  ]);

  await seedCity("Irbid", "Jordan", "JOD", [
    { name:"Irbid Mansaf House", nameAr:"بيت منسف إربد", cuisineTag:"Jordanian · Mansaf · Traditional", heroEmoji:"🏠", ratingAvg:4.8, etaMinsLow:20, etaMinsHigh:35, lat:32.5556, lng:35.8500,
      items:[{category:"mains",name:"Lamb Mansaf",nameAr:"منسف لحم",description:"Irbid-style, generous portion",price:5.5},{category:"mains",name:"Chicken Freekeh",nameAr:"دجاج بالفريكة",description:"Roasted green wheat, chicken",price:4.0},{category:"drinks",name:"Laban",nameAr:"لبن",description:"Cold buttermilk",price:0.5}]},
  ]);

  await seedCity("Aqaba", "Jordan", "JOD", [
    { name:"Royal Yacht Club Aqaba", nameAr:"نادي اليخوت الملكي العقبة", cuisineTag:"Seafood · Red Sea · International", heroEmoji:"⚓", ratingAvg:4.8, etaMinsLow:30, etaMinsHigh:50, lat:29.5316, lng:35.0063,
      items:[{category:"mains",name:"Red Sea Hammour Fillet",nameAr:"فيليه هامور البحر الأحمر",description:"Pan-seared, caper beurre blanc",price:8.5},{category:"mains",name:"Mixed Seafood Grill",nameAr:"مشاوي بحرية مشكلة",description:"Prawns, squid, fish, Red Sea style",price:11.5},{category:"drinks",name:"Mango Lassi",nameAr:"مانجو لاسي",description:"Fresh mango, yoghurt, cardamom",price:1.8}]},
    { name:"Aqaba Gate Fish", nameAr:"سمك بوابة العقبة", cuisineTag:"Fish · Red Sea · Grills", heroEmoji:"🐠", ratingAvg:4.7, etaMinsLow:20, etaMinsHigh:35,
      items:[{category:"mains",name:"Freshly Caught Grill",nameAr:"شواء الصيد اليومي",description:"Today's catch, choose your style",price:6.5},{category:"mains",name:"Prawn Tagine",nameAr:"طاجين روبيان",description:"Spiced, slow-cooked prawns",price:7.2},{category:"sides",name:"Aqaba Salad",nameAr:"سلطة العقبة",description:"Red Sea herbs, olive oil",price:1.2}]},
  ]);

  // ╔══════════════════════════════════════════════════════════╗
  // ║  BAHRAIN                                                 ║
  // ╚══════════════════════════════════════════════════════════╝
  console.log("🇧🇭 Bahrain");
  await seedCity("Manama", "Bahrain", "BHD", [
    { name:"Saffron by Jena", nameAr:"زعفران من جنى", cuisineTag:"Bahraini · Gulf · Traditional", heroEmoji:"🌺", ratingAvg:4.8, etaMinsLow:25, etaMinsHigh:40, lat:26.2235, lng:50.5876,
      items:[{category:"mains",name:"Muhammar with Fish",nameAr:"محمر مع سمك",description:"Sweet Bahraini rice, grilled hamour",price:4.8},{category:"mains",name:"Lamb Machboos",nameAr:"مجبوس لحم",description:"Gulf-spiced slow-cooked lamb",price:5.5},{category:"drinks",name:"Laban Up",nameAr:"لبن آب",description:"Cold buttermilk",price:0.8}]},
    { name:"The Meat Company Bahrain", nameAr:"شركة اللحم البحرين", cuisineTag:"Steakhouse · Burgers · Grills", heroEmoji:"🥩", ratingAvg:4.7, etaMinsLow:30, etaMinsHigh:45,
      items:[{category:"mains",name:"Wagyu Ribeye 300g",nameAr:"واغيو ريب آي",description:"Grain-fed, cooked to order",price:18.0},{category:"mains",name:"Classic Cheeseburger",nameAr:"تشيز برغر كلاسيك",description:"Brioche bun, cheddar",price:6.5},{category:"sides",name:"Mac & Cheese",nameAr:"ماك وتشيز",description:"Baked, four-cheese",price:3.2}]},
    { name:"La Vitta Bahrain", nameAr:"لا فيتا البحرين", cuisineTag:"Italian · Pizza · Pasta", heroEmoji:"🍕", ratingAvg:4.6, etaMinsLow:25, etaMinsHigh:40,
      items:[{category:"mains",name:"Prawn Linguine",nameAr:"لينغويني روبيان",description:"King prawns, cherry tomato, garlic",price:7.5},{category:"mains",name:"Margherita Pizza",nameAr:"بيتزا مارغريتا",description:"San Marzano tomato, buffalo mozzarella",price:5.5},{category:"desserts",name:"Cannoli",nameAr:"كانولي",description:"Ricotta, pistachios, chocolate chips",price:2.8}]},
    { name:"Naseef Bahraini Kitchen", nameAr:"مطبخ ناصيف البحريني", cuisineTag:"Bahraini · Home-style · Authentic", heroEmoji:"🏡", ratingAvg:4.9, etaMinsLow:25, etaMinsHigh:40,
      items:[{category:"mains",name:"Chicken Machboos",nameAr:"مجبوس دجاج",description:"Bahraini spiced chicken rice",price:3.8},{category:"mains",name:"Balaleet",nameAr:"بلاليط",description:"Vermicelli with eggs, saffron",price:2.2},{category:"sides",name:"Daqoos",nameAr:"دقوس",description:"Tomato chili sauce",price:0.5}]},
    { name:"PAUL Bakery Bahrain", nameAr:"بول بيكري البحرين", cuisineTag:"French · Café · Pastries", heroEmoji:"🥐", ratingAvg:4.5, etaMinsLow:15, etaMinsHigh:30,
      items:[{category:"mains",name:"Croque Monsieur",nameAr:"كروك مسيو",description:"Ham, Emmental, béchamel",price:4.2},{category:"drinks",name:"Café au Lait",nameAr:"كافيه أو ليه",description:"Strong coffee, warm milk",price:2.5},{category:"sides",name:"Pain au Chocolat",nameAr:"بان أو شوكولا",description:"Butter croissant, dark chocolate",price:1.8}]},
  ]);

  await seedCity("Riffa", "Bahrain", "BHD", [
    { name:"Riffa Club Restaurant", nameAr:"مطعم نادي الرفاع", cuisineTag:"International · Club Dining", heroEmoji:"🏌️", ratingAvg:4.6, etaMinsLow:25, etaMinsHigh:40, lat:26.1297, lng:50.5550,
      items:[{category:"mains",name:"Grilled Tenderloin",nameAr:"تندرلوين مشوي",description:"200g, mushroom sauce",price:12.5},{category:"mains",name:"Club Sandwich",nameAr:"ساندويش الكلوب",description:"Turkey, bacon, egg, lettuce",price:5.5},{category:"sides",name:"Caesar Salad",nameAr:"سلطة سيزر",description:"Romaine, croutons, anchovy",price:3.8}]},
    { name:"Bahraini Home Kitchen Riffa", nameAr:"مطبخ بيت البحرين الرفاع", cuisineTag:"Bahraini · Traditional · Homestyle", heroEmoji:"🏘️", ratingAvg:4.8, etaMinsLow:20, etaMinsHigh:35,
      items:[{category:"mains",name:"Lamb Ouzi",nameAr:"أوزي لحم",description:"Whole roasted lamb, spiced rice",price:9.5},{category:"mains",name:"Grilled Bahraini Fish",nameAr:"سمك بحريني مشوي",description:"Gulf fish, Bahraini spices",price:6.5},{category:"drinks",name:"Bahraini Laban",nameAr:"لبن بحريني",description:"Cold fresh buttermilk",price:0.8}]},
  ]);

  await seedCity("Muharraq", "Bahrain", "BHD", [
    { name:"Bin Matar House", nameAr:"بيت بن مطر", cuisineTag:"Bahraini Heritage · Pearl · Old Town", heroEmoji:"🦪", ratingAvg:4.9, etaMinsLow:25, etaMinsHigh:40, lat:26.2576, lng:50.6128,
      items:[{category:"mains",name:"Muharraq Fish Machboos",nameAr:"مجبوس سمك المحرق",description:"Pearl diver-style fish rice",price:5.2},{category:"mains",name:"Grilled Safi",nameAr:"سافي مشوي",description:"Parrotfish, Muharraq herbs",price:6.8},{category:"drinks",name:"Qahwa Muharraqiya",nameAr:"قهوة المحرق",description:"Heritage pearl diver coffee",price:1.0}]},
  ]);

  await seedCity("Hamad Town", "Bahrain", "BHD", [
    { name:"Garden City Grill", nameAr:"مشاوي المدينة الخضراء", cuisineTag:"International · Family · Grills", heroEmoji:"🌳", ratingAvg:4.5, etaMinsLow:20, etaMinsHigh:35, lat:26.1106, lng:50.5071,
      items:[{category:"mains",name:"Mixed Grill Platter",nameAr:"مشاوي مشكلة",description:"Beef, lamb, chicken for two",price:8.5},{category:"mains",name:"Chicken Shawarma",nameAr:"شاورما دجاج",description:"Garlic sauce, pickles",price:1.8},{category:"drinks",name:"Fresh Juice",nameAr:"عصير طازج",description:"Mango, orange, or strawberry",price:1.2}]},
  ]);

  // ╔══════════════════════════════════════════════════════════╗
  // ║  OMAN                                                    ║
  // ╚══════════════════════════════════════════════════════════╝
  console.log("🇴🇲 Oman");
  await seedCity("Muscat", "Oman", "OMR", [
    { name:"Bait Al Luban Muscat", nameAr:"بيت اللبان مسقط", cuisineTag:"Omani · Traditional · Seafood", heroEmoji:"🌊", ratingAvg:4.9, etaMinsLow:30, etaMinsHigh:45, lat:23.5880, lng:58.3829,
      items:[{category:"mains",name:"Shuwa Lamb",nameAr:"شواء لحم",description:"Underground pit-roasted lamb",price:6.5},{category:"mains",name:"Mashuai",nameAr:"مشوي",description:"Grilled kingfish, lemon rice",price:5.8},{category:"drinks",name:"Omani Qahwa",nameAr:"قهوة عُمانية",description:"Rose water, cardamom, saffron",price:1.2}]},
    { name:"Ubhar Restaurant", nameAr:"مطعم عبهر", cuisineTag:"Omani Modern · Fusion", heroEmoji:"🏔️", ratingAvg:4.7, etaMinsLow:25, etaMinsHigh:40,
      items:[{category:"mains",name:"Omani Biryani",nameAr:"برياني عُماني",description:"Goat meat, fried onion, loomi",price:4.2},{category:"mains",name:"Grilled Lobster",nameAr:"لوبستر مشوي",description:"Muscat Bay lobster, garlic butter",price:9.5},{category:"sides",name:"Khubz Ragag",nameAr:"خبز رقاق",description:"Crispy Omani wafer bread",price:1.0}]},
    { name:"Kargeen Caffe Muscat", nameAr:"كارجين كافيه مسقط", cuisineTag:"Omani Café · Outdoor · Shisha", heroEmoji:"☕", ratingAvg:4.6, etaMinsLow:20, etaMinsHigh:35,
      items:[{category:"mains",name:"Omani Shuwa Sandwich",nameAr:"ساندويش شواء عُماني",description:"Pulled shuwa in Omani bread",price:2.5},{category:"drinks",name:"Karak Chai",nameAr:"كرك",description:"Spiced milk tea",price:0.5},{category:"desserts",name:"Omani Halwa",nameAr:"حلوى عُمانية",description:"Rose water, cardamom sweet",price:1.5}]},
    { name:"Shakespeare & Co Muscat", nameAr:"شكسبير وشركاه مسقط", cuisineTag:"International · Brunch · Books", heroEmoji:"📖", ratingAvg:4.5, etaMinsLow:20, etaMinsHigh:35,
      items:[{category:"mains",name:"Eggs Royale",nameAr:"بيض رويال",description:"Smoked salmon, hollandaise, English muffin",price:4.5},{category:"mains",name:"Chicken Club Sandwich",nameAr:"ساندويش كلوب دجاج",description:"Grilled chicken, bacon, avocado",price:4.0},{category:"drinks",name:"Flat White",nameAr:"فلات وايت",description:"Double ristretto, microfoam",price:1.5}]},
    { name:"Bin Ateeq Traditional", nameAr:"بن عطيق التقليدي", cuisineTag:"Omani · Heritage · Family", heroEmoji:"🏛️", ratingAvg:4.8, etaMinsLow:25, etaMinsHigh:40,
      items:[{category:"mains",name:"Harees Omani",nameAr:"هريس عُماني",description:"Slow-cooked wheat, lamb, ghee",price:3.5},{category:"mains",name:"Majboos Samak",nameAr:"مجبوس سمك",description:"Fish machboos, Omani style",price:4.8},{category:"drinks",name:"Fresh Pomegranate",nameAr:"رمان طازج",description:"Cold pressed pomegranate",price:1.2}]},
  ]);

  await seedCity("Salalah", "Oman", "OMR", [
    { name:"Coconut Grove Salalah", nameAr:"بستان جوز الهند صلالة", cuisineTag:"Omani Dhofar · Coconut · Tropical", heroEmoji:"🥥", ratingAvg:4.8, etaMinsLow:25, etaMinsHigh:40, lat:17.0151, lng:54.0924,
      items:[{category:"mains",name:"Dhofari Fish Curry",nameAr:"كاري سمك ظفاري",description:"Coconut milk, Salalah spices",price:3.8},{category:"mains",name:"Harees Dhofari",nameAr:"هريس ظفاري",description:"Dhofar highland lamb & wheat",price:3.5},{category:"drinks",name:"Fresh Coconut Water",nameAr:"ماء جوز الهند الطازج",description:"Straight from the fruit",price:1.0}]},
    { name:"Al Haneen Salalah", nameAr:"الحنين صلالة", cuisineTag:"Dhofari Traditional · Local", heroEmoji:"🌺", ratingAvg:4.7, etaMinsLow:20, etaMinsHigh:35,
      items:[{category:"mains",name:"Shuwa Dhofari",nameAr:"شواء ظفاري",description:"Salalah pit-roasted goat",price:5.5},{category:"sides",name:"Khubz Ragheed",nameAr:"خبز رغيد",description:"Salalah thin flatbread",price:0.5},{category:"drinks",name:"Dhofari Qahwa",nameAr:"قهوة ظفارية",description:"Omani coffee with Dhofar frankincense",price:0.8}]},
  ]);

  await seedCity("Nizwa", "Oman", "OMR", [
    { name:"Al Diyafa Fort Restaurant", nameAr:"مطعم قلعة الضيافة", cuisineTag:"Omani Heritage · Fort · Traditional", heroEmoji:"🏰", ratingAvg:4.9, etaMinsLow:20, etaMinsHigh:35, lat:22.9333, lng:57.5333,
      items:[{category:"mains",name:"Nizwa Shuwa",nameAr:"شواء نزوى",description:"Mountain goat pit-roasted, Nizwa style",price:5.5},{category:"mains",name:"Omani Biryani",nameAr:"برياني عُماني",description:"Spiced goat biryani",price:4.2},{category:"drinks",name:"Falaj Water",nameAr:"قهوة فلج",description:"Date juice & Omani coffee",price:0.8}]},
  ]);

  await seedCity("Sohar", "Oman", "OMR", [
    { name:"Port City Grill Sohar", nameAr:"مشاوي مدينة الميناء صحار", cuisineTag:"Omani · Seafood · Industrial", heroEmoji:"⚓", ratingAvg:4.5, etaMinsLow:20, etaMinsHigh:35, lat:24.3470, lng:56.7395,
      items:[{category:"mains",name:"Grilled Kingfish",nameAr:"كنعد مشوي",description:"Gulf kingfish, Omani herbs",price:4.8},{category:"mains",name:"Chicken Machboos",nameAr:"مجبوس دجاج",description:"Sohar-style spiced chicken rice",price:3.5},{category:"drinks",name:"Fresh Lemon",nameAr:"ليمون طازج",description:"Cold lemon with salt & cumin",price:0.5}]},
  ]);

  // ╔══════════════════════════════════════════════════════════╗
  // ║  EGYPT                                                   ║
  // ╚══════════════════════════════════════════════════════════╝
  console.log("🇪🇬 Egypt");
  await seedCity("Cairo", "Egypt", "EGP", [
    { name:"Koshary El Tahrir", nameAr:"كشري التحرير", cuisineTag:"Egyptian · Koshary · Street Food Icon", heroEmoji:"🍝", ratingAvg:4.8, etaMinsLow:15, etaMinsHigh:25, lat:30.0444, lng:31.2357,
      items:[{category:"mains",name:"Koshary Large",nameAr:"كشري كبير",description:"Rice, lentils, pasta, fried onions",price:45},{category:"mains",name:"Koshary Small",nameAr:"كشري صغير",description:"Classic street-food serving",price:30},{category:"sides",name:"Extra Dakka",nameAr:"دقة إضافي",description:"Spicy tomato vinegar sauce",price:10}]},
    { name:"Felfela Cairo", nameAr:"فلفلة القاهرة", cuisineTag:"Egyptian · Mezze · Grills", heroEmoji:"🌶️", ratingAvg:4.7, etaMinsLow:25, etaMinsHigh:40,
      items:[{category:"mains",name:"Hawawshi",nameAr:"حواوشي",description:"Spiced minced meat, crispy bread",price:75},{category:"mains",name:"Molokhia with Rabbit",nameAr:"ملوخية بالأرانب",description:"Jute leaf stew, Egyptian style",price:120},{category:"sides",name:"Baba Ganoush",nameAr:"بابا غنوج",description:"Smoky aubergine, tahini",price:55}]},
    { name:"Sequoia Cairo", nameAr:"سيكويا القاهرة", cuisineTag:"International · Nile View · Upscale", heroEmoji:"🌊", ratingAvg:4.7, etaMinsLow:35, etaMinsHigh:55,
      items:[{category:"mains",name:"Nile Perch Fillet",nameAr:"فيليه بلطي النيل",description:"Pan-seared, lemon caper butter",price:185},{category:"mains",name:"Wagyu Tenderloin",nameAr:"واغيو تندرلوين",description:"200g, red wine sauce",price:320},{category:"drinks",name:"Hibiscus Cooler",nameAr:"شراب الكركديه البارد",description:"Cold hibiscus, mint, lemon",price:45}]},
    { name:"Abou El Sid Cairo", nameAr:"أبو السيد القاهرة", cuisineTag:"Egyptian Heritage · Traditional · Homestyle", heroEmoji:"🏛️", ratingAvg:4.8, etaMinsLow:25, etaMinsHigh:40,
      items:[{category:"mains",name:"Kofta with Tomato",nameAr:"كفتة بالطماطم",description:"Baked minced meat, tomato sauce",price:85},{category:"mains",name:"Om Ali",nameAr:"أم علي",description:"Egyptian bread pudding, nuts, cream",price:65},{category:"sides",name:"Salata Baladi",nameAr:"سلطة بلدي",description:"Tomato, cucumber, lemon",price:35}]},
    { name:"Hardee's Cairo", nameAr:"هارديز القاهرة", cuisineTag:"Burgers · Chicken · Fast Food", heroEmoji:"🍟", ratingAvg:4.3, etaMinsLow:20, etaMinsHigh:30,
      items:[{category:"mains",name:"Thickburger",nameAr:"ثيك برغر",description:"Angus beef, lettuce, tomato",price:145},{category:"mains",name:"Crispy Chicken Sandwich",nameAr:"ساندويش دجاج كريسبي",description:"Buttermilk-fried chicken",price:115},{category:"sides",name:"Curly Fries",nameAr:"بطاطس كيرلي",description:"Seasoned spiral fries",price:65}]},
    { name:"Zooba Cairo", nameAr:"زوبا القاهرة", cuisineTag:"Egyptian Street Food · Modern", heroEmoji:"🎪", ratingAvg:4.6, etaMinsLow:20, etaMinsHigh:35,
      items:[{category:"mains",name:"Ful Sandwich",nameAr:"ساندويش فول",description:"Spiced fava beans, tahini, baladi bread",price:35},{category:"mains",name:"Macarona Bechamel",nameAr:"مكرونة بشاميل",description:"Egyptian pasta bake, béchamel",price:75},{category:"drinks",name:"Karkade",nameAr:"كركديه",description:"Hot or iced hibiscus",price:25}]},
    { name:"Crave Cairo", nameAr:"كريف القاهرة", cuisineTag:"Café · Brunch · Specialty Coffee", heroEmoji:"☕", ratingAvg:4.5, etaMinsLow:20, etaMinsHigh:35,
      items:[{category:"drinks",name:"Specialty Cappuccino",nameAr:"كابوتشينو متميز",description:"Single origin espresso, microfoam",price:55},{category:"mains",name:"Avocado Toast",nameAr:"توست أفوكادو",description:"Sourdough, avo, poached egg",price:85},{category:"sides",name:"Cinnamon Roll",nameAr:"لفة قرفة",description:"Warm, cream cheese glaze",price:65}]},
    { name:"Egyptian Pancake House", nameAr:"بيت البان كيك المصري", cuisineTag:"Fateer · Egyptian Pastry", heroEmoji:"🥧", ratingAvg:4.7, etaMinsLow:15, etaMinsHigh:25,
      items:[{category:"mains",name:"Fateer Meshaltet",nameAr:"فطير مشلتت",description:"Multi-layered buttery pastry",price:18},{category:"mains",name:"Sweet Fateer with Honey",nameAr:"فطير حلو بالعسل",description:"Honey, cream, nuts",price:22},{category:"mains",name:"Savory Fateer",nameAr:"فطير مالح",description:"Cheese and eggs",price:20}]},
  ]);

  await seedCity("Alexandria", "Egypt", "EGP", [
    { name:"Kadoura Seafood Alexandria", nameAr:"كادورا للمأكولات البحرية الإسكندرية", cuisineTag:"Alexandria Seafood · Fresh · Local Icon", heroEmoji:"🐟", ratingAvg:4.9, etaMinsLow:20, etaMinsHigh:35, lat:31.2001, lng:29.9187,
      items:[{category:"mains",name:"Fresh Calamari",nameAr:"كاليماري طازج",description:"Pan-fried, garlic, lemon",price:85},{category:"mains",name:"Grilled Mullet",nameAr:"بوري مشوي",description:"Alex-style, onion, spices",price:95},{category:"mains",name:"Sayadieh Alex",nameAr:"صيادية إسكندرانية",description:"Mediterranean-style fish rice",price:110}]},
    { name:"Tikka Grill Alexandria", nameAr:"تيكا غريل الإسكندرية", cuisineTag:"Egyptian Grills · Tikka · Family", heroEmoji:"🔥", ratingAvg:4.6, etaMinsLow:20, etaMinsHigh:35,
      items:[{category:"mains",name:"Mixed Tikka",nameAr:"تيكا مشكلة",description:"Chicken, beef, lamb on charcoal",price:95},{category:"mains",name:"Kofta Roll",nameAr:"رول كفتة",description:"Spiced minced meat, baladi bread",price:45},{category:"sides",name:"Tahini Salad",nameAr:"سلطة طحينة",description:"Tahini, lemon, parsley",price:30}]},
    { name:"Balbaa Alexandria", nameAr:"بلباع الإسكندرية", cuisineTag:"Alexandrian · Street Food · Local", heroEmoji:"🌊", ratingAvg:4.7, etaMinsLow:15, etaMinsHigh:25,
      items:[{category:"mains",name:"Alex Koshary",nameAr:"كشري إسكندراني",description:"Alexandrian style, extra chili",price:40},{category:"mains",name:"Ful Medames",nameAr:"فول مدمس",description:"Egyptian fava beans, olive oil",price:25},{category:"drinks",name:"Sugarcane Juice",nameAr:"عصير قصب",description:"Fresh pressed",price:20}]},
    { name:"1901 Grand Trianon", nameAr:"١٩٠١ غراند تريانون", cuisineTag:"French-Egyptian · Heritage · Café", heroEmoji:"🏰", ratingAvg:4.8, etaMinsLow:25, etaMinsHigh:40,
      items:[{category:"mains",name:"Croque Madame",nameAr:"كروك مادام",description:"Ham, cheese, fried egg, béchamel",price:85},{category:"drinks",name:"Café Grec",nameAr:"قهوة يونانية",description:"Greek-style coffee, Alexandria tradition",price:35},{category:"desserts",name:"Basbousa",nameAr:"بسبوسة",description:"Semolina cake, rose water syrup",price:45}]},
  ]);

  await seedCity("Giza", "Egypt", "EGP", [
    { name:"Mena House Pyramid View", nameAr:"ميناهاوس مطل على الأهرام", cuisineTag:"International · Heritage Hotel · Fine", heroEmoji:"🏛️", ratingAvg:4.9, etaMinsLow:35, etaMinsHigh:55, lat:30.0131, lng:31.2089,
      items:[{category:"mains",name:"Egyptian Mezze Platter",nameAr:"طبق مازة مصري",description:"Hummus, baba ganoush, falafel, pita",price:95},{category:"mains",name:"Grilled Nile Tilapia",nameAr:"بلطي نيل مشوي",description:"Fresh Nile fish, herbs",price:145},{category:"drinks",name:"Pyramid Sunrise Juice",nameAr:"عصير شروق الهرم",description:"Mango, guava, hibiscus blend",price:45}]},
    { name:"Khan El Khalili Coffee", nameAr:"قهوة خان الخليلي", cuisineTag:"Egyptian Café · Shisha · Historic", heroEmoji:"🏺", ratingAvg:4.6, etaMinsLow:15, etaMinsHigh:30,
      items:[{category:"drinks",name:"Turkish Coffee",nameAr:"قهوة تركية",description:"Finely ground, cardamom",price:25},{category:"drinks",name:"Mint Tea",nameAr:"شاي بالنعناع",description:"Fresh mint, Egyptian tea",price:15},{category:"sides",name:"Assorted Sweets",nameAr:"حلويات مشكلة",description:"Baklava, basbousa, konafa",price:55}]},
    { name:"Giza Grills", nameAr:"مشاوي الجيزة", cuisineTag:"Grills · Egyptian · Family", heroEmoji:"🍖", ratingAvg:4.5, etaMinsLow:20, etaMinsHigh:35,
      items:[{category:"mains",name:"Kofta & Kebab Platter",nameAr:"طبق كفتة وكباب",description:"Minced & cubed meat",price:85},{category:"mains",name:"Hamam Mahshi",nameAr:"حمام محشي",description:"Stuffed pigeon with freekeh",price:120},{category:"sides",name:"Egyptian Rice",nameAr:"أرز مصري",description:"Vermicelli, fluffy rice",price:20}]},
  ]);

  await seedCity("Sharm El Sheikh", "Egypt", "EGP", [
    { name:"Farsha Café Sharm", nameAr:"كافيه فرشة شرم الشيخ", cuisineTag:"Egyptian Café · Red Sea · Relaxed", heroEmoji:"🏖️", ratingAvg:4.7, etaMinsLow:20, etaMinsHigh:35, lat:27.9158, lng:34.3299,
      items:[{category:"mains",name:"Grilled Red Sea Fish",nameAr:"سمك بحر أحمر مشوي",description:"Today's catch, Sinai spices",price:145},{category:"drinks",name:"Bedouin Tea",nameAr:"شاي بدوي",description:"Desert herbs, sage",price:25},{category:"sides",name:"Pita & Dips",nameAr:"خبز وغموسات",description:"Hummus, tahini, salsa",price:45}]},
    { name:"Hard Rock Café Sharm", nameAr:"هارد روك كافيه شرم", cuisineTag:"American · Burgers · Live Music", heroEmoji:"🎸", ratingAvg:4.4, etaMinsLow:25, etaMinsHigh:40,
      items:[{category:"mains",name:"Classic Burger",nameAr:"برغر كلاسيك",description:"Beef patty, lettuce, tomato",price:125},{category:"mains",name:"Baby Back Ribs Half Rack",nameAr:"ضلوع بيبي باك نصف",description:"Smoky BBQ glaze",price:165},{category:"sides",name:"Onion Rings",nameAr:"حلقات البصل",description:"Beer-battered",price:55}]},
  ]);

  await seedCity("Hurghada", "Egypt", "EGP", [
    { name:"Portofino Hurghada", nameAr:"بورتوفينو الغردقة", cuisineTag:"Italian · Seafood · Red Sea", heroEmoji:"⛵", ratingAvg:4.6, etaMinsLow:25, etaMinsHigh:40, lat:27.2579, lng:33.8116,
      items:[{category:"mains",name:"Seafood Linguine",nameAr:"لينغويني المأكولات البحرية",description:"Red Sea prawns, calamari",price:135},{category:"mains",name:"Grilled Barracuda",nameAr:"باراكودا مشوية",description:"Red Sea catch, lemon herb",price:165},{category:"drinks",name:"Italian Lemonade",nameAr:"ليمونادة إيطالية",description:"San Pellegrino, mint",price:45}]},
    { name:"El Mina Hurghada", nameAr:"المينا الغردقة", cuisineTag:"Egyptian · Seafood · Fresh", heroEmoji:"🎣", ratingAvg:4.7, etaMinsLow:20, etaMinsHigh:35,
      items:[{category:"mains",name:"Fried Shrimp Platter",nameAr:"طبق روبيان مقلي",description:"Crispy, tartar sauce",price:95},{category:"mains",name:"Fish Tagine",nameAr:"طاجين سمك",description:"Slow-cooked Red Sea fish",price:115},{category:"sides",name:"Egyptian Bread",nameAr:"عيش بلدي",description:"Warm baladi bread",price:5}]},
  ]);

  // ── Demo user accounts ───────────────────────────────────────
  console.log("\n🔑 Seeding demo accounts...");
  const dubaiPartners = await listApprovedPartners("Dubai");
  const firstPartner = dubaiPartners[0];

  if (firstPartner && !(await getUserByEmail("owner@manqal.com"))) {
    await createUser({ email:"owner@manqal.com", passwordHash:await hashPassword("password123"), role:"restaurant_owner", name:"Manqal Grill House Owner", partnerId:firstPartner.id });
    console.log("  Seeded: owner@manqal.com / password123");
  }
  if (!(await getUserByEmail("admin@waslasouq.com"))) {
    await createUser({ email:"admin@waslasouq.com", passwordHash:await hashPassword("admin123"), role:"admin", name:"Wasla Souq Admin", partnerId:null });
    console.log("  Seeded: admin@waslasouq.com / admin123");
  }
  if (!(await getUserByEmail("rider@waslasouq.com"))) {
    const rider = await createUser({ email:"rider@waslasouq.com", passwordHash:await hashPassword("rider123"), role:"rider", name:"Yusuf K.", partnerId:null });
    await ensureRiderProfile(rider!.id);
    console.log("  Seeded: rider@waslasouq.com / rider123");
  }
  console.log("\n✅ Multi-city seed complete!");
}

main().catch((e) => { console.error(e); process.exit(1); }).then(() => process.exit(0));


