package com.chino.inventory_backend.config;

import com.chino.inventory_backend.model.Category;
import com.chino.inventory_backend.model.Product;
import com.chino.inventory_backend.model.Sale;
import com.chino.inventory_backend.model.SaleItem;
import com.chino.inventory_backend.model.User;
import com.chino.inventory_backend.repository.CategoryRepository;
import com.chino.inventory_backend.repository.ProductRepository;
import com.chino.inventory_backend.repository.SaleRepository;
import com.chino.inventory_backend.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Component
public class DataInitializer implements CommandLineRunner {

    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final CategoryRepository categoryRepository;
    private final SaleRepository saleRepository;

    public DataInitializer(ProductRepository productRepository, UserRepository userRepository,
                           CategoryRepository categoryRepository, SaleRepository saleRepository) {
        this.productRepository = productRepository;
        this.userRepository = userRepository;
        this.categoryRepository = categoryRepository;
        this.saleRepository = saleRepository;
    }

    @Override
    public void run(String... args) {
        seedAdminUser();
        seedCategories();
        seedInitialProducts();
        seedInitialSales();
    }

    private void seedAdminUser() {
        if (!userRepository.existsByUsername("admin")) {
            User admin = new User("admin", "admin123", "ADMIN", "Store Manager");
            userRepository.save(admin);
            System.out.println(">>> Seeded default admin: admin / admin123");
        }
    }

    private void seedCategories() {
        if (categoryRepository.count() == 0) {
            List<Category> cats = List.of(
                new Category("Instant Food", "Quick meals, ramen, and instant noodles"),
                new Category("Beverages", "Drinks, juices, sodas, and coffee"),
                new Category("Canned Goods", "Canned fish, meats, and vegetables"),
                new Category("Condiments", "Sauces, spices, and cooking oils"),
                new Category("Snacks", "Chips, cookies, and biscuits"),
                new Category("Rice & Staples", "Rice grains, sugar, and flour"),
                new Category("Toiletries", "Soaps, shampoos, and detergents"),
                new Category("Frozen Goods", "Hotdogs, patties, and ice cream"),
                new Category("Bakery & Bread", "Loaf bread, pandesal, and pastries")
            );
            categoryRepository.saveAll(cats);
        }
    }

    private void seedInitialProducts() {
        if (productRepository.count() == 0) {
            List<Product> products = List.of(
                // Instant Noodles & Soups
                new Product("Lucky Me! Pancit Canton Kalamansi 80g", new BigDecimal("16.00"), "Instant Food", 120, "pack", null, "Citrus-infused instant stir-fried noodles"),
                new Product("Lucky Me! Pancit Canton Chilimansi 80g", new BigDecimal("16.00"), "Instant Food", 95, "pack", null, "Spicy calamansi flavored pancit canton"),
                new Product("Lucky Me! Pancit Canton Original 80g", new BigDecimal("16.00"), "Instant Food", 80, "pack", null, "Classic savory stir-fried noodles"),
                new Product("Lucky Me! Pancit Canton Hot Chili 80g", new BigDecimal("16.00"), "Instant Food", 65, "pack", null, "Spicy hot flavor pancit canton"),
                new Product("Lucky Me! Supreme La Paz Batchoy 65g", new BigDecimal("32.50"), "Instant Food", 40, "cup", null, "Rich broth cup noodles with pork cracklings"),
                new Product("Nissin Cup Noodles Seafood 60g", new BigDecimal("35.00"), "Instant Food", 45, "cup", null, "Creamy savory seafood noodle soup"),

                // Canned Goods & Preserved Food
                new Product("Century Tuna Flakes in Oil 155g", new BigDecimal("38.50"), "Canned Goods", 85, "can", null, "Tender tuna flakes in rich vegetable oil"),
                new Product("Century Tuna Hot & Spicy 155g", new BigDecimal("39.00"), "Canned Goods", 70, "can", null, "Spicy seasoned canned tuna flakes"),
                new Product("555 Sardines in Tomato Sauce 155g", new BigDecimal("24.00"), "Canned Goods", 110, "can", null, "Classic Philippine sardines with tomato sauce"),
                new Product("555 Sardines Spicy 155g", new BigDecimal("24.00"), "Canned Goods", 90, "can", null, "Spicy tomato sauce canned sardines"),
                new Product("Argentina Corned Beef 175g", new BigDecimal("44.00"), "Canned Goods", 60, "can", null, "Rich, seasoned breakfast corned beef"),
                new Product("Purefoods Corned Beef 210g", new BigDecimal("98.00"), "Canned Goods", 35, "can", null, "Premium juicy shredded corned beef"),
                new Product("Spam Classic Luncheon Meat 340g", new BigDecimal("185.00"), "Canned Goods", 18, "can", null, "Original premium pork luncheon meat"),
                new Product("CDO Meat Loaf 150g", new BigDecimal("28.00"), "Canned Goods", 50, "can", null, "Savory ready-to-fry meat loaf"),

                // Beverages & Coffee
                new Product("Coca-Cola 1.5L PET", new BigDecimal("75.00"), "Beverages", 40, "bottle", null, "Classic refreshing carbonated soft drink"),
                new Product("Coca-Cola Mismo 290ml", new BigDecimal("18.00"), "Beverages", 80, "bottle", null, "Handy on-the-go single serve bottle"),
                new Product("Royal Tru-Orange 1.5L PET", new BigDecimal("72.00"), "Beverages", 30, "bottle", null, "Sparkling orange flavored soft drink"),
                new Product("Sprite 1.5L PET", new BigDecimal("72.00"), "Beverages", 25, "bottle", null, "Crisp lemon-lime soda"),
                new Product("Kopiko Blanca 3-in-1 Twin Pack 52g", new BigDecimal("15.00"), "Beverages", 150, "sachet", null, "Creamy sweet white coffee twin pack"),
                new Product("Great Taste White Twin Pack 50g", new BigDecimal("14.50"), "Beverages", 140, "sachet", null, "Smooth white coffee blend"),
                new Product("Milo Chocolate Malt Drink 24g", new BigDecimal("12.00"), "Beverages", 200, "sachet", null, "Nutritious chocolate malt powder"),
                new Product("Nescafe Classic Refill 50g", new BigDecimal("48.00"), "Beverages", 45, "pouch", null, "100% pure soluble coffee powder"),
                new Product("San Miguel Pale Pilsen 330ml Can", new BigDecimal("55.00"), "Beverages", 48, "can", null, "Legendary Filipino crisp pilsen beer"),
                new Product("Red Horse Extra Strong Beer 500ml", new BigDecimal("65.00"), "Beverages", 36, "bottle", null, "High-alcohol premium strong lager"),

                // Condiments & Cooking Essentials
                new Product("Silver Swan Soy Sauce 1 Liter", new BigDecimal("42.00"), "Condiments", 35, "bottle", null, "Premium brewed Filipino toyo"),
                new Product("Datu Puti White Vinegar 1 Liter", new BigDecimal("38.00"), "Condiments", 40, "bottle", null, "Pure naturally fermented cane vinegar"),
                new Product("UFC Banana Ketchup Tamis-Anghang 320g", new BigDecimal("26.00"), "Condiments", 50, "bottle", null, "Sweet and spicy Filipino banana sauce"),
                new Product("Mang Tomas All-Around Sarsa 325g", new BigDecimal("36.00"), "Condiments", 30, "bottle", null, "Savory liver relish sauce for lechon and fried meats"),
                new Product("Magic Sarap All-in-One Seasoning 8g", new BigDecimal("5.00"), "Condiments", 300, "sachet", null, "Granulated chicken and garlic seasoning"),
                new Product("Golden Fiesta Palm Cooking Oil 1L Pouch", new BigDecimal("88.00"), "Condiments", 30, "pouch", null, "Refined clear cooking oil for deep frying"),
                new Product("Knorr Sinigang sa Sampalok Mix 44g", new BigDecimal("22.00"), "Condiments", 75, "pack", null, "Real tamarind soup base seasoning"),

                // Snacks & Biscuits
                new Product("SkyFlakes Crackers Single Pack 3s", new BigDecimal("8.00"), "Snacks", 180, "pack", null, "Crispy oven-baked crackers"),
                new Product("Fita Round Biscuits 30g", new BigDecimal("9.00"), "Snacks", 120, "pack", null, "Savory lightly buttered crackers"),
                new Product("Piattos Cheese Flavored Potato Crisps 85g", new BigDecimal("38.00"), "Snacks", 55, "bag", null, "Hexagonal crispy cheese potato snacks"),
                new Product("Nova Country Cheddar Multigrain Snacks 78g", new BigDecimal("38.00"), "Snacks", 45, "bag", null, "Multigrain fiber rich savory crisps"),
                new Product("Oishi Prawn Crackers Spicy 60g", new BigDecimal("22.00"), "Snacks", 60, "bag", null, "Crispy shrimp flavored prawn crackers"),
                new Product("Chippy Barbecue Corn Chips 110g", new BigDecimal("32.00"), "Snacks", 50, "bag", null, "Crunchy barbecue seasoned corn chips"),

                // Rice & Staples
                new Product("Sinandomeng Special White Rice 1kg", new BigDecimal("54.00"), "Rice & Staples", 100, "kg", null, "Soft and fluffy everyday staple rice"),
                new Product("Dinorado Fragrant Premium Rice 1kg", new BigDecimal("62.00"), "Rice & Staples", 80, "kg", null, "Aromatic long-grain premium white rice"),
                new Product("Washed Brown Sugar 1kg", new BigDecimal("70.00"), "Rice & Staples", 40, "kg", null, "Natural pure cane brown sugar"),
                new Product("Refined White Sugar 1kg", new BigDecimal("78.00"), "Rice & Staples", 35, "kg", null, "Fine granulated white refined sugar"),

                // Toiletries & Home Essentials
                new Product("Safeguard Pure White Bar Soap 130g", new BigDecimal("48.00"), "Toiletries", 60, "bar", null, "Classic germ-protection bath bar soap"),
                new Product("Palmolive Shampoo Intensive Moisture Sachet 15ml", new BigDecimal("7.50"), "Toiletries", 150, "sachet", null, "Coconut cream enriched nourishing shampoo"),
                new Product("Head & Shoulders Cool Menthol Sachet 12ml", new BigDecimal("8.50"), "Toiletries", 120, "sachet", null, "Anti-dandruff refreshing shampoo"),
                new Product("Colgate Great Regular Flavor Toothpaste 150g", new BigDecimal("95.00"), "Toiletries", 30, "tube", null, "Fluoride cavity protection toothpaste"),
                new Product("Surf Powder Cherry Blossom 1kg", new BigDecimal("115.00"), "Toiletries", 25, "pouch", null, "Fragrant laundry detergent washing powder"),
                new Product("Joy Dishwashing Liquid Kalamansi 250ml", new BigDecimal("45.00"), "Toiletries", 40, "bottle", null, "Grease-cutting concentrated dishwashing liquid")
            );

            productRepository.saveAll(products);
            System.out.println(">>> Seeded retail store inventory products!");
        }
    }

    private void seedInitialSales() {
        if (saleRepository.count() == 0) {
            LocalDateTime now = LocalDateTime.now();

            // Today's sales
            Sale saleToday1 = new Sale(new BigDecimal("186.00"), new BigDecimal("200.00"), new BigDecimal("14.00"), now.minusHours(2));
            saleToday1.addItem(new SaleItem(saleToday1, null, "Lucky Me! Pancit Canton Kalamansi 80g", 3, new BigDecimal("16.00"), new BigDecimal("48.00")));
            saleToday1.addItem(new SaleItem(saleToday1, null, "Coca-Cola 1.5L PET", 1, new BigDecimal("75.00"), new BigDecimal("75.00")));
            saleToday1.addItem(new SaleItem(saleToday1, null, "San Miguel Pale Pilsen 330ml Can", 1, new BigDecimal("55.00"), new BigDecimal("55.00")));
            saleToday1.addItem(new SaleItem(saleToday1, null, "SkyFlakes Crackers Single Pack 3s", 1, new BigDecimal("8.00"), new BigDecimal("8.00")));
            saleRepository.save(saleToday1);

            Sale saleToday2 = new Sale(new BigDecimal("342.00"), new BigDecimal("500.00"), new BigDecimal("158.00"), now.minusMinutes(45));
            saleToday2.addItem(new SaleItem(saleToday2, null, "Sinandomeng Special White Rice 1kg", 2, new BigDecimal("54.00"), new BigDecimal("108.00")));
            saleToday2.addItem(new SaleItem(saleToday2, null, "Purefoods Corned Beef 210g", 2, new BigDecimal("98.00"), new BigDecimal("196.00")));
            saleToday2.addItem(new SaleItem(saleToday2, null, "Century Tuna Hot & Spicy 155g", 1, new BigDecimal("38.00"), new BigDecimal("38.00")));
            saleRepository.save(saleToday2);

            // Earlier this week sales
            Sale saleWeek1 = new Sale(new BigDecimal("820.00"), new BigDecimal("1000.00"), new BigDecimal("180.00"), now.minusDays(2));
            saleRepository.save(saleWeek1);

            Sale saleWeek2 = new Sale(new BigDecimal("1450.00"), new BigDecimal("1500.00"), new BigDecimal("50.00"), now.minusDays(3));
            saleRepository.save(saleWeek2);

            // Earlier this month sales
            Sale saleMonth1 = new Sale(new BigDecimal("4200.00"), new BigDecimal("5000.00"), new BigDecimal("800.00"), now.minusDays(10));
            saleRepository.save(saleMonth1);

            Sale saleMonth2 = new Sale(new BigDecimal("6850.00"), new BigDecimal("7000.00"), new BigDecimal("150.00"), now.minusDays(16));
            saleRepository.save(saleMonth2);

            System.out.println(">>> Seeded initial sales data for today, week, and month!");
        }
    }
}
