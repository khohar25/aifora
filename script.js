// ==========================================
// KONFIGURASI DATA (Menggunakan API Django PythonAnywhere)
// ==========================================

// State Management
let allBooks = []; 
let wishlist = JSON.parse(localStorage.getItem('aifora_wishlist')) || [];
let uniqueCategories = new Set();
let bannerSlideInterval; 

// ==========================================
// KECERDASAN BUATAN PENGKATEGORIAN BUKU (REGEX PINTAR)
// ==========================================
function autoCategorize(title) {
    if (!title) return 'Buku Umum';
    const lower = title.toLowerCase();

    const categoriesMap = [
        { cat: 'Agama & Spiritualitas', keys: ['agama', 'islam', 'kristen', 'katolik', 'hindu', 'buddha', 'doa', 'tuhan', 'nabi', 'hijrah', 'quran', 'hadits', 'ibadah', 'spiritual', 'iman'] },
        { cat: 'Bisnis & Ekonomi', keys: ['bisnis', 'ekonomi', 'uang', 'saham', 'investasi', 'marketing', 'kaya', 'finansial', 'cuan', 'manajemen', 'startup', 'wirausaha', 'akuntansi'] },
        { cat: 'Komputer & Teknologi', keys: ['komputer', 'coding', 'pemrograman', 'html', 'javascript', 'python', 'php', 'website', 'aplikasi', 'software', 'hardware', 'teknologi', 'data', 'ai', 'internet', 'jaringan'] },
        { cat: 'Komik & Novel Grafis', keys: ['komik', 'manga', 'manhwa', 'webtoon', 'conan', 'naruto', 'one piece', 'doraemon', 'grafis', 'marvel', 'dc'] },
        { cat: 'Resep & Masakan', keys: ['resep', 'masak', 'makanan', 'minuman', 'kue', 'dapur', 'kuliner', 'menu', 'baking', 'chef', 'diet', 'hidangan'] },
        { cat: 'Kesehatan & Medis', keys: ['sehat', 'kebugaran', 'medis', 'dokter', 'penyakit', 'obat', 'keperawatan', 'anatomi', 'gizi', 'olahraga', 'yoga'] },
        { cat: 'Pendidikan & Ujian', keys: ['cpns', 'sbmptn', 'snbt', 'ujian', 'rumus', 'matematika', 'fisika', 'kimia', 'biologi', 'kamus', 'inggris', 'toefl', 'pelajaran', 'sekolah', 'soal', 'pendidikan', 'belajar'] },
        { cat: 'Pengembangan Diri', keys: ['habit', 'mindset', 'motivasi', 'sukses', 'self improvement', 'produktif', 'berani', 'kepemimpinan', 'leadership', 'psikologi', 'mental', 'overthinking', 'bahagia', 'filsafat'] },
        { cat: 'Buku Anak', keys: ['anak', 'dongeng', 'mewarnai', 'balita', 'parenting', 'bayi', 'cerita anak', 'pintar', 'bocah'] },
        { cat: 'Biografi & Memoar', keys: ['biografi', 'memoar', 'kisah hidup', 'tokoh', 'jejak', 'autobiografi'] },
        { cat: 'Sejarah & Sosial Politik', keys: ['sejarah', 'politik', 'sosial', 'budaya', 'hukum', 'undang-undang', 'kerajaan', 'perang', 'nasionalisme', 'pki', 'orde'] },
        { cat: 'Romantis & Sastra', keys: ['cinta', 'rindu', 'romantis', 'puisi', 'sastra', 'patah hati', 'senja', 'kekasih', 'kasih'] },
        { cat: 'Fiksi Dewasa & Thriller', keys: ['dewasa', '18+', 'metropop', 'thriller', 'misteri', 'detektif', 'pembunuhan', 'horor', 'hantu'] },
        { cat: 'Fiksi & Novel Umum', keys: ['novel', 'fiksi', 'cerita', 'fantasi', 'petualangan', 'kisah'] },
        { cat: 'Majalah', keys: ['majalah', 'magazine', 'tabloid'] },
        { cat: 'Seni & Desain', keys: ['seni', 'desain', 'arsitektur', 'gambar', 'lukisan', 'fotografi'] }
    ];

    for (let i = 0; i < categoriesMap.length; i++) {
        const match = categoriesMap[i].keys.some(keyword => {
            const regex = new RegExp(`\\b${keyword}\\b`, 'i');
            return regex.test(lower);
        });
        if (match) return categoriesMap[i].cat;
    }
    return 'Buku Umum'; 
}

// ==========================================
// FETCH & PROCESS DATA DARI SERVER PYTHON
// ==========================================
async function fetchBooks() {
    const spinner = document.getElementById('loading-spinner');
    if (spinner) spinner.style.display = 'block';

    try {
        // Mengambil data dari server Django kamu
        const response = await fetch('https://aifora.pythonanywhere.com/api/buku/');
        if (!response.ok) throw new Error('Gagal mengambil data dari server');
        
        const data = await response.json();
        
        const uniqueBooks = [];
        const titles = new Set();

        // Menerjemahkan data dari Django ke format web
        data.forEach((book) => {
            const title = book.judul || "";
            const price = book.harga || "Cek Harga";
            const image = book.link_gambar || "https://via.placeholder.com/400?text=No+Cover";
            const link = book.link_shopee || "#";
            const category = book.kategori || autoCategorize(title);
            const desc = book.deskripsi || "Buku ini sangat menarik untuk dibaca.";
            const rating = book.rating || "4.8";
            const sold = book.terjual || 150;

            if (title && !titles.has(title.toLowerCase())) {
                titles.add(title.toLowerCase());
                uniqueCategories.add(category);
                uniqueBooks.push({ 
                    id: "book_" + book.id, // Menggunakan ID asli dari database Django
                    title, image, price, link, category, desc, rating, sold 
                });
            }
        });

        allBooks = uniqueBooks;
        renderCategories();
        renderViralBanner(allBooks);
        renderBooks(allBooks); 
        updateWishlistUI();

    } catch (error) {
        console.error("Error Fetch API:", error);
        if (spinner) spinner.innerHTML = "<p class='text-red-500 font-bold'>Gagal terhubung ke server database Aifora.</p>";
    }
}

// ==========================================
// RENDER RAK BUKU & KATEGORI
// ==========================================
function renderCategories() {
    const container = document.getElementById('filter-container');
    if (!container) return;
    
    let html = `<button type="button" class="filter-btn active whitespace-nowrap px-4 py-2 rounded-full bg-blue-600 text-white text-sm font-semibold transition-colors shadow-sm" data-filter="all">Semua Kategori</button>`;
    
    Array.from(uniqueCategories).sort().forEach(cat => {
        html += `<button type="button" class="filter-btn whitespace-nowrap px-4 py-2 rounded-full bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 text-sm font-semibold transition-colors hover:border-blue-500 shadow-sm" data-filter="${cat}">${cat}</button>`;
    });

    container.innerHTML = html;
    attachFilterEvents();
}

function renderBooks(booksToDisplay) {
    const shelvesContainer = document.getElementById('shelves-container');
    const emptyState = document.getElementById('empty-state');
    const spinner = document.getElementById('loading-spinner');
    
    if (spinner) spinner.style.display = 'none';
    if (!shelvesContainer) return;
    
    shelvesContainer.innerHTML = '';

    if (booksToDisplay.length === 0) {
        if (emptyState) emptyState.classList.remove('hidden'); 
        return;
    } else {
        if (emptyState) emptyState.classList.add('hidden');
    }

    const booksByCategory = {};
    booksToDisplay.forEach(book => {
        if (!booksByCategory[book.category]) {
            booksByCategory[book.category] = [];
        }
        booksByCategory[book.category].push(book);
    });

    for (const [categoryName, booksInCat] of Object.entries(booksByCategory)) {
        const shelfDiv = document.createElement('div');
        shelfDiv.className = 'flex flex-col fade-in-up mb-8';
        const safeId = "shelf-" + categoryName.replace(/[^a-zA-Z0-9]/g, '-');
        
        shelfDiv.innerHTML = `
            <div class="flex justify-between items-end mb-4 px-1">
                <h3 class="text-xl md:text-2xl font-black text-gray-800 dark:text-white flex items-center gap-2 border-l-4 border-blue-600 pl-3">
                    ${categoryName}
                </h3>
                <span class="text-sm font-bold text-blue-600 hover:text-blue-800 cursor-pointer transition-colors whitespace-nowrap hidden sm:block">
                    Lihat ${booksInCat.length} Buku
                </span>
            </div>
            <div class="flex overflow-x-auto hide-scroll smooth-scroll snap-x snap-mandatory gap-4 pb-4 px-1 pt-1" id="${safeId}">
            </div>
        `;
        
        shelvesContainer.appendChild(shelfDiv);
        const rowContainer = document.getElementById(safeId);

        booksInCat.forEach(book => {
            const isWished = wishlist.some(w => w.id === book.id);
            const heartIcon = isWished ? "ph-fill text-red-500" : "ph text-gray-400 hover:text-red-500";

            const card = document.createElement('div');
            card.className = `book-card-3d min-w-[150px] md:min-w-[190px] max-w-[150px] md:max-w-[190px] bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-lg transition-all duration-300 overflow-hidden group flex flex-col snap-start cursor-pointer`;
            card.onclick = () => openDetail(book.id);

            card.innerHTML = `
                <div class="book-cover-3d relative overflow-hidden aspect-[3/4] bg-gray-50 dark:bg-slate-700 p-2 flex items-center justify-center">
                    <img src="${book.image}" loading="lazy" class="max-w-full max-h-full object-contain drop-shadow-md transition-transform group-hover:scale-105" onerror="this.src='https://via.placeholder.com/400?text=No+Cover'">
                    <button type="button" onclick="event.stopPropagation(); toggleWishlist('${book.id}')" class="absolute top-2 right-2 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm p-1.5 rounded-full shadow-sm hover:scale-110 transition-transform z-20">
                        <i class="${heartIcon} text-lg" id="heart-${book.id}"></i>
                    </button>
                </div>
                <div class="p-3 flex flex-col flex-grow bg-white dark:bg-slate-800">
                    <h2 class="font-bold text-sm text-gray-900 dark:text-white leading-tight mb-1 line-clamp-2">${book.title}</h2>
                    <div class="flex items-center gap-1 mb-1">
                        <i class="ph-fill ph-star text-yellow-400 text-[10px]"></i>
                        <span class="text-[10px] text-gray-500 font-bold">${book.rating}</span>
                    </div>
                    <p class="text-orange-500 font-black text-sm mb-2">${book.price}</p>
                    <a href="${book.link}" onclick="event.stopPropagation();" target="_blank" class="mt-auto block w-full text-center bg-blue-50 dark:bg-slate-700 text-blue-600 dark:text-white hover:bg-blue-600 hover:text-white font-bold py-1.5 rounded-lg transition-colors text-xs border border-blue-100 dark:border-gray-600">
                        Beli
                    </a>
                </div>
            `;
            rowContainer.appendChild(card);
        });
    }
}

// ==========================================
// BANNER CAROUSEL
// ==========================================
function renderViralBanner(books) {
    const bannerContainer = document.getElementById('viral-banner');
    const bannerWrapper = document.getElementById('viral-banner-container');
    
    if (!bannerContainer || books.length < 3) return;

    const today = new Date();
    const dayOfYear = Math.floor((today - new Date(today.getFullYear(), 0, 0)) / 1000 / 60 / 60 / 24);
    
    const trendingBooks = [];
    for (let i = 0; i < 6; i++) {
        trendingBooks.push(books[(dayOfYear + i) % books.length]);
    }
    
    let html = '';
    trendingBooks.forEach(book => {
        html += `
            <div class="min-w-[85%] md:min-w-[400px] bg-gradient-to-r from-blue-600 to-indigo-800 rounded-3xl p-5 md:p-6 flex flex-row items-center gap-4 shadow-xl relative overflow-hidden text-white cursor-pointer hover:scale-[1.02] transition-transform snap-center" onclick="openDetail('${book.id}')">
                <i class="ph-fill ph-sparkle absolute -right-6 -bottom-6 text-7xl opacity-10 text-white"></i>
                <div class="w-24 md:w-32 aspect-[3/4] bg-white p-2 rounded-xl shadow-lg z-10 flex-shrink-0 flex items-center justify-center">
                    <img src="${book.image}" loading="lazy" class="max-w-full max-h-full object-contain rounded-lg" onerror="this.src='https://via.placeholder.com/400?text=No+Cover'">
                </div>
                <div class="z-10 flex flex-col items-start text-left flex-grow">
                    <span class="bg-orange-500 text-white px-2 py-1 rounded text-[10px] font-bold uppercase tracking-widest mb-2 shadow-sm">${book.category}</span>
                    <h2 class="text-lg md:text-xl font-black mb-1 leading-tight line-clamp-2">${book.title}</h2>
                    <p class="text-blue-200 text-sm font-bold">${book.price}</p>
                </div>
            </div>`;
    });
    
    bannerContainer.innerHTML = html;
    bannerWrapper.classList.remove('hidden');

    if (bannerSlideInterval) clearInterval(bannerSlideInterval);
    bannerSlideInterval = setInterval(() => {
        const firstChild = bannerContainer.firstElementChild;
        if (firstChild) {
            const itemWidth = firstChild.offsetWidth + 16; 
            if (bannerContainer.scrollLeft + bannerContainer.clientWidth >= bannerContainer.scrollWidth - 10) {
                bannerContainer.scrollTo({ left: 0, behavior: 'smooth' });
            } else {
                bannerContainer.scrollBy({ left: itemWidth, behavior: 'smooth' });
            }
        }
    }, 3000); 
}

// ==========================================
// DETAIL BUKU
// ==========================================
function openDetail(bookId) {
    const book = allBooks.find(b => b.id === bookId);
    if (!book) return;
    
    const cWindow = document.getElementById('chat-window');
    if (cWindow && cWindow.style.display !== 'none') {
        toggleChat();
    }

    document.getElementById('home-view').classList.add('hidden');
    const detailView = document.getElementById('detail-view');
    
    detailView.innerHTML = `
        <button type="button" onclick="closeDetail()" class="mb-6 flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:text-blue-800 font-bold transition-colors">
            <i class="ph-bold ph-arrow-left text-xl"></i> Kembali
        </button>
        <div class="bg-white dark:bg-slate-800 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden flex flex-col md:flex-row">
            <div class="md:w-1/2 bg-gray-50 dark:bg-slate-700 p-8 flex items-center justify-center aspect-square">
                <img src="${book.image}" class="max-w-full max-h-full object-contain drop-shadow-2xl" onerror="this.src='https://via.placeholder.com/400?text=No+Cover'">
            </div>
            <div class="md:w-1/2 p-8 md:p-12 flex flex-col">
                <span class="text-sm font-bold text-blue-500 uppercase tracking-widest mb-2">${book.category}</span>
                <h2 class="text-3xl md:text-4xl font-black text-gray-900 dark:text-white mb-4 leading-tight">${book.title}</h2>
                <div class="flex items-center gap-4 mb-8 bg-gray-50 dark:bg-slate-900 p-3 rounded-xl w-fit border border-gray-100 dark:border-gray-700">
                    <span class="flex items-center text-yellow-500 font-bold gap-1 text-lg">
                        <i class="ph-fill ph-star"></i> ${book.rating}
                    </span>
                    <span class="text-gray-300 dark:text-gray-600">|</span>
                    <span class="text-gray-600 dark:text-gray-400 font-medium">
                        <i class="ph-fill ph-shopping-cart text-blue-500"></i> ${book.sold}+ Terjual
                    </span>
                </div>
                <h3 class="font-bold text-gray-900 dark:text-white mb-2 text-lg">Deskripsi Singkat:</h3>
                <p class="text-gray-600 dark:text-gray-300 mb-8 leading-relaxed text-lg">${book.desc}</p>
                <div class="mt-auto flex flex-col gap-4">
                    <p class="text-4xl font-black text-orange-500">${book.price}</p>
                    <div class="flex gap-4">
                        <a href="${book.link}" target="_blank" class="flex-grow bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-700 text-white text-center py-4 rounded-xl font-bold transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-1 flex items-center justify-center gap-2 text-lg">
                            <i class="ph-fill ph-shopping-bag"></i> Beli Sekarang
                        </a>
                        <button type="button" onclick="toggleWishlist('${book.id}')" class="px-6 border-2 border-gray-200 dark:border-gray-700 hover:border-red-500 text-gray-600 dark:text-gray-300 hover:text-red-500 rounded-xl transition-colors flex items-center justify-center bg-white dark:bg-slate-800">
                            <i class="ph ph-heart text-3xl" id="detail-heart-${book.id}"></i>
                        </button>
                    </div>
                </div>
            </div>
        </div>`;
        
    const detailHeart = document.getElementById(`detail-heart-${book.id}`);
    if (wishlist.some(w => w.id === book.id)) { 
        detailHeart.classList.remove('ph'); 
        detailHeart.classList.add('ph-fill', 'text-red-500'); 
    }
    detailView.classList.remove('hidden'); 
    window.scrollTo(0, 0);
}

function closeDetail() {
    document.getElementById('detail-view').classList.add('hidden');
    document.getElementById('home-view').classList.remove('hidden');
    window.scrollTo(0, 0);
}

// ==========================================
// PENCARIAN & FILTER
// ==========================================
const searchInput = document.getElementById('search-input');
if (searchInput) {
    searchInput.addEventListener('input', (e) => {
        const keyword = e.target.value.toLowerCase();
        const bannerContainer = document.getElementById('viral-banner-container');
        
        if (keyword.length > 0) bannerContainer.style.display = 'none';
        else bannerContainer.style.display = 'block';
        
        renderBooks(allBooks.filter(b => b.title.toLowerCase().includes(keyword)));
    });
}

function attachFilterEvents() {
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.filter-btn').forEach(b => {
                b.classList.remove('active', 'bg-blue-600', 'text-white');
                b.classList.add('bg-white', 'text-gray-600', 'dark:bg-slate-800', 'dark:text-gray-300');
            });
            
            btn.classList.add('active', 'bg-blue-600', 'text-white');
            btn.classList.remove('bg-white', 'text-gray-600', 'dark:bg-slate-800', 'dark:text-gray-300');

            const cat = btn.getAttribute('data-filter');
            
            if (searchInput) searchInput.value = ''; 
            document.getElementById('viral-banner-container').style.display = 'block'; 
            
            renderBooks(cat === 'all' ? allBooks : allBooks.filter(b => b.category === cat));
        });
    });
}

// ==========================================
// FITUR WISHLIST & TOAST NOTIFICATION
// ==========================================
function showToast(message, isRemoved = false) {
    const toast = document.createElement('div');
    const icon = isRemoved ? '<i class="ph-fill ph-trash text-red-400"></i>' : '<i class="ph-fill ph-check-circle text-green-400"></i>';
    
    toast.className = 'fixed bottom-24 left-1/2 transform -translate-x-1/2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-6 py-3 rounded-full shadow-2xl z-[150] text-sm font-bold toast-animate flex items-center gap-2';
    toast.innerHTML = `${icon} ${message}`;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.add('opacity-0', 'translate-y-4');
        toast.style.transition = 'all 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 2000);
}

function toggleWishlist(bookId) {
    const book = allBooks.find(b => b.id === bookId);
    const index = wishlist.findIndex(w => w.id === bookId);
    
    if (index === -1) {
        wishlist.push(book); 
        showToast('Buku disimpan ke rak!');
    } else {
        wishlist.splice(index, 1);
        showToast('Buku dihapus dari rak!', true);
    }
    
    localStorage.setItem('aifora_wishlist', JSON.stringify(wishlist));
    updateWishlistUI();
    
    const heart = document.getElementById(`heart-${bookId}`);
    if (heart) { 
        heart.classList.toggle('ph'); 
        heart.classList.toggle('text-gray-400'); 
        heart.classList.toggle('ph-fill'); 
        heart.classList.toggle('text-red-500'); 
    }
    
    const detailHeart = document.getElementById(`detail-heart-${bookId}`);
    if (detailHeart) { 
        detailHeart.classList.toggle('ph'); 
        detailHeart.classList.toggle('ph-fill'); 
        detailHeart.classList.toggle('text-red-500'); 
    }
}

function updateWishlistUI() {
    const count = document.getElementById('wishlist-count');
    const items = document.getElementById('wishlist-items');
    
    if (!count || !items) return;
    
    if (wishlist.length > 0) { 
        count.textContent = wishlist.length; 
        count.classList.remove('hidden'); 
    } else {
        count.classList.add('hidden');
    }
    
    items.innerHTML = wishlist.length === 0 ? `<div class="text-center text-gray-400 mt-10"><i class="ph ph-books text-4xl mb-2"></i><p>Rakmu masih kosong.</p></div>` : '';
    
    wishlist.forEach(book => {
        items.innerHTML += `
            <div class="flex gap-3 bg-gray-50 dark:bg-slate-800 p-2 rounded-xl border border-gray-100 dark:border-gray-700">
                <img src="${book.image}" loading="lazy" class="w-16 h-16 object-contain rounded-lg bg-white" onerror="this.src='https://via.placeholder.com/100?text=No+Cover'">
                <div class="flex flex-col flex-grow">
                    <h4 class="font-bold text-sm dark:text-white line-clamp-2">${book.title}</h4>
                    <p class="text-xs text-orange-500 font-bold mt-1">${book.price}</p>
                    <div class="mt-auto flex gap-2">
                        <a href="${book.link}" target="_blank" class="text-xs bg-blue-600 text-white px-2 py-1 rounded-md text-center flex-grow">Beli</a>
                        <button type="button" onclick="toggleWishlist('${book.id}')" class="text-xs text-red-600 bg-red-100 px-2 rounded-md"><i class="ph ph-trash"></i></button>
                    </div>
                </div>
            </div>`;
    });
}

const wSidebar = document.getElementById('wishlist-sidebar');
const wOverlay = document.getElementById('overlay');

function toggleSidebar() { 
    if (wSidebar && wOverlay) { 
        wSidebar.classList.toggle('translate-x-full'); 
        wOverlay.classList.toggle('hidden'); 
        setTimeout(() => wOverlay.classList.toggle('opacity-0'), 10); 
    }
}

document.getElementById('wishlist-btn')?.addEventListener('click', toggleSidebar); 
document.getElementById('close-wishlist')?.addEventListener('click', toggleSidebar); 
wOverlay?.addEventListener('click', toggleSidebar);

// ==========================================
// TEMA DARK MODE & MUSIK LOFI
// ==========================================
const html = document.documentElement;
const themeToggleBtn = document.getElementById('theme-toggle');

if (localStorage.getItem('theme') === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    html.classList.add('dark');
}

if (themeToggleBtn) { 
    themeToggleBtn.addEventListener('click', () => { 
        html.classList.toggle('dark'); 
        localStorage.setItem('theme', html.classList.contains('dark') ? 'dark' : 'light'); 
    }); 
}

const lofiBtn = document.getElementById('lofi-btn');
let audio = new Audio('https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=lofi-study-112191.mp3'); 
audio.loop = true; 
audio.volume = 0.3; 
let isPlaying = false; 

if (lofiBtn) {
    lofiBtn.addEventListener('click', () => {
        if (isPlaying) { 
            audio.pause(); 
            lofiBtn.innerHTML = '<i class="ph ph-headphones text-xl"></i>'; 
            lofiBtn.classList.remove('bg-blue-100', 'text-blue-600'); 
        } else { 
            audio.play().catch(err => console.log("Audio diblokir browser")); 
            lofiBtn.innerHTML = '<i class="ph-fill ph-speaker-high text-xl"></i>'; 
            lofiBtn.classList.add('bg-blue-100', 'text-blue-600'); 
        }
        isPlaying = !isPlaying;
    });
}

// ==========================================
// CHATBOT PINTAR AIFORA
// ==========================================
function toggleChat(event) {
    if (event) event.stopPropagation(); 
    const cWindow = document.getElementById('chat-window');
    if (!cWindow) return;
    
    if (cWindow.style.display === 'none' || cWindow.classList.contains('hidden')) {
        cWindow.style.display = 'flex'; 
        cWindow.classList.remove('hidden'); 
        setTimeout(() => { cWindow.classList.remove('scale-95', 'opacity-0'); }, 10);
    } else {
        cWindow.classList.add('scale-95', 'opacity-0'); 
        setTimeout(() => { cWindow.style.display = 'none'; cWindow.classList.add('hidden'); }, 300);
    }
}

function generateBookBubble(books) {
    if (!books || books.length === 0) return '';
    let html = '<div class="flex flex-col gap-2 mt-2 w-full">';
    
    books.slice(0, 3).forEach(book => {
        html += `
        <div onclick="openDetail('${book.id}')" class="flex items-center gap-3 bg-white dark:bg-slate-800 p-2 rounded-lg border border-gray-200 dark:border-gray-600 cursor-pointer hover:bg-blue-50 dark:hover:bg-slate-700 transition-colors">
            <img src="${book.image}" loading="lazy" class="w-10 h-10 object-cover rounded shadow-sm" onerror="this.src='https://via.placeholder.com/100?text=No+Cover'">
            <div class="flex flex-col flex-grow overflow-hidden">
                <span class="text-xs font-bold text-gray-800 dark:text-white truncate">${book.title}</span>
                <span class="text-[10px] font-black text-orange-500">${book.price}</span>
            </div>
        </div>`;
    });
    
    html += '</div>';
    if (books.length > 3) {
        html += `<div class="text-[10px] text-gray-500 mt-1 italic">Dan ${books.length - 3} buku lainnya...</div>`;
    }
    return html;
}

function processUserMessage(text) {
    const lowerText = text.toLowerCase();
    let replyText = ""; 
    let matchedBooks = [];

    const detectedCategory = autoCategorize(lowerText);
    
    if (detectedCategory !== 'Buku Umum') {
        matchedBooks = allBooks.filter(b => b.category === detectedCategory);
        replyText = `Ini beberapa rekomendasi dari rak ${detectedCategory} yang pas untukmu:`;
    } 
    else if (lowerText.includes('halo') || lowerText.includes('hai')) {
        replyText = "Halo juga! 👋 Aku Pustakawan Aifora. Coba ketik judul buku, atau tema seperti 'bisnis', 'masak', atau 'komik'!";
    }
    else {
        const cleanText = lowerText.replace(/cari|buku|tolong|ada|gak|dong/g, '').trim();
        if (cleanText.length > 2) {
            matchedBooks = allBooks.filter(b => b.title.toLowerCase().includes(cleanText));
        }
        
        if (matchedBooks.length > 0) {
            replyText = `Aku menemukan beberapa buku yang mirip dengan kata kuncimu. Coba cek ini:`;
        } else {
            replyText = "Hmm, aku belum menemukan buku yang pas di rak saat ini. Coba gunakan istilah lain, seperti 'novel', 'bisnis', atau nama penulisnya!";
        }
    }
    return { replyText, matchedBooks };
}

function handleChat() {
    const chatInput = document.getElementById('chat-input');
    const chatMessages = document.getElementById('chat-messages');
    
    if (!chatInput || !chatMessages) return;
    
    const text = chatInput.value.trim(); 
    if (!text) return;
    
    const userDiv = document.createElement('div'); 
    userDiv.className = "bg-blue-600 text-white p-3 rounded-lg rounded-tr-none self-end max-w-[85%] shadow-sm"; 
    userDiv.textContent = text; 
    
    chatMessages.appendChild(userDiv); 
    chatInput.value = ''; 
    chatMessages.scrollTop = chatMessages.scrollHeight;
    
    const typingDiv = document.createElement('div');
    typingDiv.className = "text-gray-400 text-xs mt-1 ml-1 animate-pulse"; 
    typingDiv.textContent = "Aifora sedang mencari...";
    
    chatMessages.appendChild(typingDiv); 
    chatMessages.scrollTop = chatMessages.scrollHeight;

    setTimeout(() => {
        chatMessages.removeChild(typingDiv);
        
        const responseData = processUserMessage(text);
        
        const aiDiv = document.createElement('div'); 
        aiDiv.className = "bg-gray-100 dark:bg-slate-700 dark:text-gray-200 p-3 rounded-lg rounded-tl-none self-start max-w-[90%] shadow-sm flex flex-col"; 
        
        let innerHTML = `<span>${responseData.replyText}</span>`;
        if (responseData.matchedBooks.length > 0) {
            innerHTML += generateBookBubble(responseData.matchedBooks);
        }
        
        aiDiv.innerHTML = innerHTML; 
        chatMessages.appendChild(aiDiv); 
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }, 1000);
}

// ==========================================
// MODAL LOGIN / REGISTER (Auth Modal)
// ==========================================
function toggleAuthModal() {
    const modal = document.getElementById('auth-modal');
    const modalContent = document.getElementById('auth-modal-content');
    
    if (!modal || !modalContent) return;

    if (modal.classList.contains('hidden')) {
        modal.classList.remove('hidden');
        setTimeout(() => {
            modal.classList.remove('opacity-0');
            modalContent.classList.remove('scale-95');
        }, 10);
    } else {
        modal.classList.add('opacity-0');
        modalContent.classList.add('scale-95');
        setTimeout(() => {
            modal.classList.add('hidden');
        }, 300); 
    }
}

// Tutup modal jika user klik area gelap (overlay)
document.getElementById('auth-modal')?.addEventListener('click', function(event) {
    if (event.target === this) {
        toggleAuthModal();
    }
});

// ==========================================
// START APP
// ==========================================
fetchBooks();