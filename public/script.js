/* =========================================================
   CONTENT CRAFTERS — Site Script
   Vanilla JS only. Organized by feature. All content arrays
   below are placeholder data — replace with real project
   info, then the UI updates automatically.
   ========================================================= */
(function () {
  "use strict";

  var prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;

  /* ---------------------------------------------------------
     1. SPLASH SCREEN
  --------------------------------------------------------- */
  (function splash() {
    var splashEl = document.getElementById("splash");
    var video = document.getElementById("splashVideo");
    var progressBar = document.getElementById("splashProgressBar");
    var skipBtn = document.getElementById("splashSkip");
    var body = document.body;
    var closed = false;

    function closeSplash() {
      if (closed) return;
      closed = true;
      splashEl.classList.add("is-leaving");
      body.classList.remove("splash-active");
      setTimeout(
        function () {
          splashEl.setAttribute("hidden", "");
        },
        prefersReducedMotion ? 0 : 900,
      );
    }

    // Skip splash entirely for reduced-motion users
    if (prefersReducedMotion) {
      closeSplash();
      return;
    }

    // Skip if already seen this session (nice repeat-visit UX)
    var seen = false;
    try {
      seen = sessionStorage.getItem("cc_splash_seen") === "1";
    } catch (e) {}
    if (seen) {
      closeSplash();
      return;
    }

    skipBtn.addEventListener("click", function () {
      try {
        sessionStorage.setItem("cc_splash_seen", "1");
      } catch (e) {}
      closeSplash();
    });

    video.addEventListener("ended", function () {
      try {
        sessionStorage.setItem("cc_splash_seen", "1");
      } catch (e) {}
      closeSplash();
    });

    video.addEventListener("timeupdate", function () {
      if (video.duration) {
        progressBar.style.width =
          (video.currentTime / video.duration) * 100 + "%";
      }
    });

    // Safety net: never trap the user on the splash for more than ~9s
    setTimeout(closeSplash, 9000);
  })();

  /* ---------------------------------------------------------
     2. NAVBAR: scroll state + mobile menu
  --------------------------------------------------------- */
  (function nav() {
    var navbar = document.getElementById("navbar");
    var hamburger = document.getElementById("hamburger");
    var mobileMenu = document.getElementById("mobileMenu");
    var overlay = document.getElementById("mobileOverlay");

    function onScroll() {
      if (window.scrollY > 30) navbar.classList.add("scrolled");
      else navbar.classList.remove("scrolled");
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    function toggleMenu(open) {
      var isOpen =
        open !== undefined ? open : !hamburger.classList.contains("active");
      hamburger.classList.toggle("active", isOpen);
      mobileMenu.classList.toggle("active", isOpen);
      overlay.classList.toggle("active", isOpen);
      hamburger.setAttribute("aria-expanded", String(isOpen));
      document.documentElement.classList.toggle("no-scroll", isOpen);
    }

    hamburger.addEventListener("click", function () {
      toggleMenu();
    });
    overlay.addEventListener("click", function () {
      toggleMenu(false);
    });
    mobileMenu.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () {
        toggleMenu(false);
      });
    });
  })();

  /* ---------------------------------------------------------
     3. FILMSTRIP (hero signature element) — auto-populate + loop
  --------------------------------------------------------- */
  (function filmstrip() {
    var track = document.getElementById("filmstrip");
    if (!track) return;
    var labels = [
      "Branding",
      "Social",
      "SEO",
      "Video",
      "Photography",
      "Ads",
      "Reels",
      "Strategy",
    ];
    var html = "";
    labels.forEach(function (l) {
      html += '<div class="film-frame">' + l + "</div>";
    });
    // duplicate for seamless marquee loop
    track.innerHTML = html + html;
  })();

  /* ---------------------------------------------------------
     4. SCROLL REVEAL
  --------------------------------------------------------- */
  (function reveal() {
    var items = document.querySelectorAll(".reveal");
    if (prefersReducedMotion || !("IntersectionObserver" in window)) {
      items.forEach(function (el) {
        el.classList.add("in-view");
      });
      return;
    }
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("in-view");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" },
    );
    items.forEach(function (el) {
      io.observe(el);
    });
  })();

  /* ---------------------------------------------------------
     5. ANIMATED COUNTERS (stats section)
  --------------------------------------------------------- */
  (function counters() {
    var counters = document.querySelectorAll(".counter");
    if (!counters.length) return;

    function animateCounter(el) {
      var target = parseInt(el.getAttribute("data-target"), 10) || 0;
      if (prefersReducedMotion) {
        el.textContent = target;
        return;
      }
      var start = 0;
      var duration = 1400;
      var startTime = null;
      function step(ts) {
        if (!startTime) startTime = ts;
        var progress = Math.min((ts - startTime) / duration, 1);
        var eased = 1 - Math.pow(1 - progress, 3);
        el.textContent = Math.floor(eased * (target - start) + start);
        if (progress < 1) requestAnimationFrame(step);
        else el.textContent = target;
      }
      requestAnimationFrame(step);
    }

    if (!("IntersectionObserver" in window)) {
      counters.forEach(animateCounter);
      return;
    }
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            animateCounter(entry.target);
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.6 },
    );
    counters.forEach(function (c) {
      io.observe(c);
    });
  })();

  /* ---------------------------------------------------------
     6. DATA — services, why-us, portfolio, videos, photos,
        case studies, process, benefits, testimonials.
        Edit these arrays to update site content everywhere.
  --------------------------------------------------------- */
  var ICONS = {
    marketing:
      '<path d="M3 11h4l5-4v10l-5-4H3v-2Z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="M15 9a3 3 0 0 1 0 6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>',
    seo: '<circle cx="10" cy="10" r="6" stroke="currentColor" stroke-width="1.6"/><path d="m20 20-5.5-5.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>',
    social:
      '<rect x="3" y="4" width="14" height="11" rx="2" stroke="currentColor" stroke-width="1.6"/><path d="M7 20h6M9 15v5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/><circle cx="18" cy="6" r="3" stroke="currentColor" stroke-width="1.6"/>',
    branding:
      '<path d="M12 3v3M12 18v3M3 12h3M18 12h3" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/><circle cx="12" cy="12" r="5" stroke="currentColor" stroke-width="1.6"/>',
    design:
      '<rect x="3" y="3" width="8" height="8" rx="2" stroke="currentColor" stroke-width="1.6"/><rect x="13" y="3" width="8" height="8" rx="2" stroke="currentColor" stroke-width="1.6"/><rect x="3" y="13" width="8" height="8" rx="2" stroke="currentColor" stroke-width="1.6"/><rect x="13" y="13" width="8" height="8" rx="2" stroke="currentColor" stroke-width="1.6"/>',
    video:
      '<rect x="3" y="6" width="13" height="12" rx="2" stroke="currentColor" stroke-width="1.6"/><path d="m16 10 5-3v10l-5-3" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>',
    editing:
      '<path d="M4 7h16M4 12h10M4 17h7" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/><circle cx="19" cy="17" r="2.5" stroke="currentColor" stroke-width="1.6"/>',
    photo:
      '<rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" stroke-width="1.6"/><circle cx="12" cy="12" r="3.5" stroke="currentColor" stroke-width="1.6"/><path d="M8 5l1.5-2h5L16 5" stroke="currentColor" stroke-width="1.6"/>',
    growth:
      '<path d="M3 17l6-6 4 4 8-8" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M15 7h6v6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>',
  };

  var SERVICES = [
    {
      num: "01",
      icon: "marketing",
      name: "Digital Marketing",
      desc: "Strategy, campaign management, lead generation and online advertising.",
    },
    {
      num: "02",
      icon: "seo",
      name: "SEO & Search Marketing",
      desc: "Keyword research, on-page SEO, local SEO and search visibility.",
    },
    {
      num: "03",
      icon: "social",
      name: "Social Media Management",
      desc: "Instagram, Facebook, YouTube — content planning and audience engagement.",
    },
    {
      num: "04",
      icon: "branding",
      name: "Branding & Logo Design",
      desc: "Logo design, brand identity, guidelines and business collateral.",
    },
    {
      num: "05",
      icon: "design",
      name: "Creative Design",
      desc: "Banners, posters, social creatives and advertising designs.",
    },
    {
      num: "06",
      icon: "video",
      name: "Video Production",
      desc: "Product shoots, promotional videos, brand films and reels.",
    },
    {
      num: "07",
      icon: "editing",
      name: "Video Editing",
      desc: "Professional edits, motion graphics and colour correction.",
    },
    {
      num: "08",
      icon: "photo",
      name: "Photography",
      desc: "Product, brand and promotional photography for every platform.",
    },
    {
      num: "09",
      icon: "growth",
      name: "Business Growth",
      desc: "Positioning, customer acquisition and long-term growth planning.",
    },
  ];

  var WHY = [
    {
      icon: "branding",
      title: "Strategy First",
      desc: "We understand your business before creating a marketing strategy.",
    },
    {
      icon: "design",
      title: "Creative Thinking",
      desc: "We create content that is designed to capture attention.",
    },
    {
      icon: "growth",
      title: "Everything Under One Roof",
      desc: "Marketing, branding, design, photography and video in one place.",
    },
    {
      icon: "marketing",
      title: "Customized Solutions",
      desc: "Every business gets a strategy based on its specific goals.",
    },
    {
      icon: "social",
      title: "Consistent Brand Identity",
      desc: "Keep your visual identity consistent across every platform.",
    },
    {
      icon: "seo",
      title: "Growth Focused",
      desc: "The ultimate goal is not just beautiful content — it is business growth.",
    },
  ];

  var PORTFOLIO = [
    {
      cat: "realestate",
      catLabel: "Real Estate",
      title: "Real Estate Podcast — Yash Realty",
      client: "Yash Realty",
      desc: "On-camera interview segment produced for Yash Realty, covering site progress and buyer Q&A.",
      img: "assets/videos/real-estate/podcast-interview.mp4",
      poster: "assets/posters/podcast-interview.jpg",
      type: "video",
      services: "Video Production, Editing",
    },
    {
      cat: "realestate",
      catLabel: "Real Estate",
      title: "Site Walkthrough Reel",
      client: "Yash Realty",
      desc: "On-site property walkthrough shot and edited for social distribution.",
      img: "assets/videos/real-estate/site-walkthrough.mp4",
      poster: "assets/posters/site-walkthrough.jpg",
      type: "video",
      services: "Video Production, Social Media",
    },

    {
      cat: "jewellery",
      catLabel: "Jewellery & Luxury",
      title: "Elegance That Shines",
      client: "Jewellery Brand",
      desc: "Product-style reel from a jewellery collection shoot.",
      img: "assets/videos/jewellery/1.mp4",
      poster: "assets/posters/jewellery-1.jpg",
      type: "video",
      services: "Jewellery, Product & Luxury",
    },
    //{ cat: 'jewellery', catLabel: 'Jewellery', title: 'Jewellery Collection — Look 2', client: '[CLIENT NAME]', desc: 'Product-style reel from a jewellery collection shoot.', img: 'assets/videos/jewellery/2.mp4', poster: 'assets/posters/jewellery-2.jpg', type: 'video', services: 'Product Video, Photography' },
    //{ cat: 'jewellery', catLabel: 'Jewellery', title: 'Jewellery Collection — Look 3', client: '[CLIENT NAME]', desc: 'Product-style reel from a jewellery collection shoot.', img: 'assets/videos/jewellery/3.mp4', poster: 'assets/posters/jewellery-3.jpg', type: 'video', services: 'Product Video, Photography' },
    //{ cat: 'jewellery', catLabel: 'Jewellery', title: 'Jewellery Collection — Look 4', client: '[CLIENT NAME]', desc: 'Product-style reel from a jewellery collection shoot.', img: 'assets/videos/jewellery/4.mp4', poster: 'assets/posters/jewellery-4.jpg', type: 'video', services: 'Product Video, Photography' },
    // { cat: 'jewellery', catLabel: 'Jewellery', title: 'Jewellery Collection — Look 5', client: '[CLIENT NAME]', desc: 'Product-style reel from a jewellery collection shoot.', img: 'assets/videos/jewellery/5.mp4', poster: 'assets/posters/jewellery-5.jpg', type: 'video', services: 'Product Video, Photography' },
    // { cat: 'jewellery', catLabel: 'Jewellery', title: 'Jewellery Collection — Look 6', client: '[CLIENT NAME]', desc: 'Product-style reel from a jewellery collection shoot.', img: 'assets/videos/jewellery/6.mp4', poster: 'assets/posters/jewellery-6.jpg', type: 'video', services: 'Product Video, Photography' },
    //{ cat: 'jewellery', catLabel: 'Jewellery', title: 'Jewellery Collection — Look 7', client: '[CLIENT NAME]', desc: 'Product-style reel from a jewellery collection shoot.', img: 'assets/videos/jewellery/7.mp4', poster: 'assets/posters/jewellery-7.jpg', type: 'video', services: 'Product Video, Photography' },
    {
      cat: "jewellery",
      catLabel: "Jewellery & Luxury",
      title: "Elegance That Shines",
      client: "Jewellery Brand",
      desc: "Product-style reel from a jewellery collection shoot.",
      img: "assets/videos/jewellery/8.mp4",
      poster: "assets/posters/jewellery-8.jpg",
      type: "video",
      services: "Jewellery, Product & Luxury",
    },

    {
      cat: "fashion",
      catLabel: "Fashion & Lifestyle",
      title: "Style in Motion",
      client: "Fashion Brand",
      desc: "Fashion styling reel produced for social distribution.",
      img: "assets/videos/fashion/fashion-01.mp4",
      poster: "assets/posters/fashion-01.jpg",
      type: "video",
      services: "Fashion Video, Styling",
    },
    {
      cat: "fashion",
      catLabel: "Fashion & Lifestyle",
      title: "Style in Motion",
      client: "Fashion Brand",
      desc: "Fashion styling reel produced for social distribution.",
      img: "assets/videos/fashion/fashion-02.mp4",
      poster: "assets/posters/fashion-02.jpg",
      type: "video",
      services: "Fashion, Lifestyle & Creative Direction",
    },
    {
      cat: "fashion",
      catLabel: "Fashion & Lifestyle",
      title: "Style in Motion",
      client: "Fashion Brand",
      desc: "Fashion styling reel produced for social distribution.",
      img: "assets/videos/fashion/fashion-03.mp4",
      poster: "assets/posters/fashion-03.jpg",
      type: "video",
      services: "Fashion Video, Styling",
    },

    {
      cat: "weddings",
      catLabel: "Weddings & Events",
      title: "Pre-Wedding Film — Devam & Helly",
      client: "Devam & Helly",
      desc: "Cinematic pre-wedding film shot across multiple outdoor and indoor locations.",
      img: "assets/videos/weddings/pre-wedding-01.mp4",
      poster: "assets/posters/pre-wedding-01.jpg",
      type: "video",
      services: "Wedding Film, Video Editing",
    },

    {
      cat: "weddings",
      catLabel: "Wedding & Pre-Wedding",
      title: "A Story Before Forever",
      client: "Wedding Shoot",
      desc: "Cinematic pre-wedding film shot across multiple outdoor and indoor locations.",
      img: "assets/videos/weddings/Wedding.mp4",
      poster: "assets/posters/weddings.png",
      type: "video",
      services: "Wedding, Pre-Wedding & Photography",
    },

    {
      cat: "branding",
      catLabel: "Branding & Corporate",
      title: "Brand Social Reel — Cake \u2018N\u2019 Joy",
      client: "Cake \u2018N\u2019 Joy",
      desc: "Lifestyle-style social content produced for a bakery brand.",
      img: "assets/videos/branding/cake-01.mp4",
      poster: "assets/posters/cake-01.jpg",
      type: "video",
      services: "Social Media, Branding",
    },

    {
      cat: "branding",
      catLabel: "Fashion & Clothing",
      title: "Style in Every Stitch",
      client: "Clothing Brand",
      desc: "Lifestyle-style social content produced for a shirt.",
      img: "assets/videos/branding/Personal branding.mp4",
      poster: "assets/posters/shirt.png",
      type: "video",
      services: "Fashion, Product & Lifestyle",
    },

    {
      cat: "branding",
      catLabel: "Dance & Lifestyle",
      title: "Dance in Motion",
      client: "HDS",
      desc: "Dynamic dance content capturing rhythm, confidence, energy, and expressive movement.",
      img: "assets/videos/branding/dance.mp4",
      poster: "assets/posters/dance.png",
      type: "video",
      services: "Dance, Fashion & Lifestyle",
    },

    {
      cat: "Interiors & Travel",
      catLabel: "Travel & Lifestyle",
      title: "Wander Beyond",
      client: "Travel Shoot",
      desc: "Cinematic travel content capturing adventure, freedom, breathtaking destinations, and unforgettable moments.",
      img: "assets/videos/travels/travel.mp4",
      poster: "assets/posters/travel.png",
      type: "video",
      services: "Travel, Lifestyle & Photography",
    },

    {
      cat: "ai",
      catLabel: "AI Videos",
      title: "AI Avatar Video — AP Dziner",
      client: "AP Dziner",
      desc: "AI-generated presenter-style video produced for a personal brand.",
      img: "assets/videos/ai/ai-01.mp4",
      poster: "assets/posters/ai-01.jpg",
      type: "video",
      services: "AI Video Production",
    },
    {
      cat: "ai",
      catLabel: "AI Videos",
      title: "AI Avatar Video — Nexus Overseas",
      client: "Nexus Overseas Services Kota Pvt. Ltd.",
      desc: "AI-generated presenter-style video produced for a corporate client.",
      img: "assets/videos/ai/ai-02.mp4",
      poster: "assets/posters/ai-02.jpg",
      type: "video",
      services: "AI Video Production",
    },
  ];

  var PROCESS = [
    {
      num: "01",
      title: "Discover",
      desc: "Understand the business and goals.",
    },
    {
      num: "02",
      title: "Strategize",
      desc: "Build the right marketing and creative strategy.",
    },
    {
      num: "03",
      title: "Create",
      desc: "Produce content, designs, videos and campaigns.",
    },
    {
      num: "04",
      title: "Execute",
      desc: "Launch the marketing campaign and digital activities.",
    },
    {
      num: "05",
      title: "Grow",
      desc: "Analyze performance and improve continuously.",
    },
  ];

  var BENEFITS = [
    {
      title: "More Visibility",
      desc: "Get your business in front of the right audience.",
    },
    {
      title: "Stronger Brand",
      desc: "Build a professional and recognizable identity.",
    },
    {
      title: "Better Content",
      desc: "Professional videos, photography and creative designs.",
    },
    {
      title: "Consistent Online Presence",
      desc: "Maintain an active and professional digital presence.",
    },
    {
      title: "More Opportunities",
      desc: "Reach potential customers through targeted marketing.",
    },
    {
      title: "Less Hassle",
      desc: "One team handles your marketing and creative requirements.",
    },
  ];

  var TESTIMONIALS = [
    {
      quote:
        "“Content Crafters gave our real estate brand a completely new look. From property videos and creative posts to social media marketing, their team helped us present our projects professionally and bring in more genuine enquiries.”",
      name: "yash reality",
      co: "swastiikgroup",
      stars: 5,
    },
    {
      quote:
        "“They understood exactly how to capture the energy of our dance studio. The reels, videos and social media content have helped us showcase our classes much better and attract more students.”",
      name: "himani dance studio",
      co: "HDS",
      stars: 5,
    },
    {
      quote:
        "“Content Crafters helped us turn our fashion collection into content that people actually notice. Their photography, video editing and social media creatives made our brand look more premium and helped us connect with a wider audience.”",
      name: "[CLIENT NAME]",
      co: "[COMPANY NAME]",
      stars: 5,
    },
  ];

  function svgIcon(key) {
    return (
      '<svg viewBox="0 0 24 24" fill="none">' +
      (ICONS[key] || ICONS.marketing) +
      "</svg>"
    );
  }
  function starSvg() {
    return '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.9 6.6 7.1.7-5.4 4.7 1.7 7-6.3-3.8L5.7 21l1.7-7-5.4-4.7 7.1-.7L12 2z"/></svg>';
  }

  /* ---------------------------------------------------------
     7. RENDER: Services
  --------------------------------------------------------- */
  (function renderServices() {
    var grid = document.getElementById("servicesGrid");
    if (!grid) return;
    var revealClasses = ["reveal-1", "reveal-2", "reveal-3"];
    grid.innerHTML = SERVICES.map(function (s, i) {
      return (
        "" +
        '<div class="service-card reveal ' +
        revealClasses[i % 3] +
        '">' +
        '<div class="service-top">' +
        '<span class="service-num">' +
        s.num +
        "</span>" +
        '<span class="service-icon">' +
        svgIcon(s.icon) +
        "</span>" +
        "</div>" +
        "<h3>" +
        s.name +
        "</h3>" +
        "<p>" +
        s.desc +
        "</p>" +
        '<a href="#contact" class="service-link">Explore Service ' +
        '<svg viewBox="0 0 24 24" fill="none"><path d="M7 17L17 7M17 7H9M17 7V15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>' +
        "</a>" +
        "</div>"
      );
    }).join("");
    observeNewReveals(grid);
  })();

  /* ---------------------------------------------------------
     8. RENDER: Why Us
  --------------------------------------------------------- */
  (function renderWhy() {
    var grid = document.getElementById("whyGrid");
    if (!grid) return;
    var revealClasses = ["reveal-1", "reveal-2", "reveal-3"];
    grid.innerHTML = WHY.map(function (w, i) {
      return (
        "" +
        '<div class="why-card reveal ' +
        revealClasses[i % 3] +
        '">' +
        '<div class="why-icon">' +
        svgIcon(w.icon) +
        "</div>" +
        "<h3>" +
        w.title +
        "</h3>" +
        "<p>" +
        w.desc +
        "</p>" +
        "</div>"
      );
    }).join("");
    observeNewReveals(grid);
  })();

  /* ---------------------------------------------------------
     9. RENDER + FILTER: Portfolio
  --------------------------------------------------------- */
  var portfolioGrid = document.getElementById("portfolioGrid");
  var portfolioEmpty = document.getElementById("portfolioEmpty");

  function renderPortfolio() {
    if (!portfolioGrid) return;
    portfolioGrid.innerHTML = PORTFOLIO.map(function (p, i) {
      var thumbSrc = p.type === "video" ? p.poster || p.img : p.img;
      var thumb =
        '<img src="' +
        thumbSrc +
        '" alt="' +
        p.title +
        ' by Content Crafters" loading="lazy">';
      var playBtn =
        p.type === "video"
          ? '<div class="video-play-btn"><div class="circle"><svg viewBox="0 0 24 24" fill="none"><path d="M6 4l14 8-14 8V4z" fill="currentColor"/></svg></div></div>'
          : "";
      return (
        "" +
        '<div class="portfolio-item" data-cat="' +
        p.cat +
        '" data-index="' +
        i +
        '">' +
        thumb +
        playBtn +
        '<span class="portfolio-badge">Video</span>' +
        '<div class="portfolio-overlay">' +
        '<div class="portfolio-cat">' +
        p.catLabel +
        "</div>" +
        "<h3>" +
        p.title +
        "</h3>" +
        "<span>" +
        p.client +
        "</span>" +
        "</div>" +
        "</div>"
      );
    }).join("");

    portfolioGrid.querySelectorAll(".portfolio-item").forEach(function (el) {
      el.addEventListener("click", function () {
        var p = PORTFOLIO[parseInt(el.getAttribute("data-index"), 10)];
        if (p.type === "video") {
          openVideoModal({ title: p.title, client: p.client, src: p.img });
        } else {
          openProjectModal(p);
        }
      });
    });
  }
  renderPortfolio();

  (function portfolioFilters() {
    var bar = document.getElementById("portfolioFilters");
    if (!bar) return;
    bar.addEventListener("click", function (e) {
      var btn = e.target.closest(".filter-btn");
      if (!btn) return;
      bar.querySelectorAll(".filter-btn").forEach(function (b) {
        b.classList.remove("active");
      });
      btn.classList.add("active");
      var filter = btn.getAttribute("data-filter");
      var visibleCount = 0;
      portfolioGrid
        .querySelectorAll(".portfolio-item")
        .forEach(function (item) {
          var match =
            filter === "all" || item.getAttribute("data-cat") === filter;
          item.classList.toggle("hide", !match);
          if (match) visibleCount++;
        });
      if (portfolioEmpty) {
        portfolioEmpty.style.display = visibleCount === 0 ? "block" : "none";
        portfolioEmpty.textContent =
          visibleCount === 0
            ? "No " +
              btn.textContent.trim() +
              " projects published yet — check back soon."
            : "";
      }
    });
  })();

  /* ---------------------------------------------------------
     13. RENDER: Process
  --------------------------------------------------------- */
  (function renderProcess() {
    var wrap = document.getElementById("processLine");
    if (!wrap) return;
    wrap.innerHTML = PROCESS.map(function (p) {
      return (
        "" +
        '<div class="process-step reveal">' +
        '<div class="process-num">' +
        p.num +
        "</div>" +
        "<h3>" +
        p.title +
        "</h3>" +
        "<p>" +
        p.desc +
        "</p>" +
        "</div>"
      );
    }).join("");
    observeNewReveals(wrap);
  })();

  /* ---------------------------------------------------------
     14. RENDER: Client Benefits
  --------------------------------------------------------- */
  (function renderBenefits() {
    var grid = document.getElementById("benefitsGrid");
    if (!grid) return;
    grid.innerHTML = BENEFITS.map(function (b) {
      return (
        '<div class="benefit-card"><h3>' +
        b.title +
        "</h3><p>" +
        b.desc +
        "</p></div>"
      );
    }).join("");
  })();

  /* ---------------------------------------------------------
     15. PROJECT MODAL (portfolio + photography + case studies)
  --------------------------------------------------------- */
  var modalOverlay = document.getElementById("modalOverlay");
  var modalMedia = document.getElementById("modalMedia");
  var modalCat = document.getElementById("modalCat");
  var modalTitle = document.getElementById("modalTitle");
  var modalClient = document.getElementById("modalClient");
  var modalServices = document.getElementById("modalServices");
  var modalDesc = document.getElementById("modalDesc");
  var modalClose = document.getElementById("modalClose");

  function openProjectModal(p) {
    modalMedia.src = p.img;
    modalMedia.alt = p.title
      ? p.title + (p.client ? " — " + p.client : "")
      : "Project image";
    modalCat.textContent = p.catLabel || "";
    modalTitle.textContent = p.title || "";
    modalClient.textContent = p.client || "";
    modalServices.textContent = p.services || "";
    modalDesc.textContent = p.desc || "";
    modalOverlay.classList.add("active");
    document.documentElement.classList.add("no-scroll");
  }
  function closeProjectModal() {
    modalOverlay.classList.remove("active");
    document.documentElement.classList.remove("no-scroll");
  }
  modalClose.addEventListener("click", closeProjectModal);
  modalOverlay.addEventListener("click", function (e) {
    if (e.target === modalOverlay) closeProjectModal();
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") closeProjectModal();
  });

  /* ---------------------------------------------------------
     16. VIDEO MODAL (full playback with controls)
  --------------------------------------------------------- */
  var videoModalOverlay = document.getElementById("videoModalOverlay");
  var videoModalPlayer = document.getElementById("videoModalPlayer");
  var videoModalClose = document.getElementById("videoModalClose");
  var vmPlayPause = document.getElementById("vmPlayPause");
  var vmPlayIcon = document.getElementById("vmPlayIcon");
  var vmMute = document.getElementById("vmMute");
  var vmMuteIcon = document.getElementById("vmMuteIcon");
  var vmFullscreen = document.getElementById("vmFullscreen");

  var ICON_PLAY = '<path d="M6 4l14 8-14 8V4z" fill="currentColor"/>';
  var ICON_PAUSE = '<path d="M6 5h4v14H6zM14 5h4v14h-4z" fill="currentColor"/>';
  var ICON_MUTE = '<path d="M4 9v6h4l5 5V4L8 9H4Z" fill="currentColor"/>';
  var ICON_UNMUTE =
    '<path d="M4 9v6h4l5 5V4L8 9H4Z" fill="currentColor"/><path d="M17.5 8.5a5 5 0 0 1 0 7" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>';

  function openVideoModal(v) {
    if (!v.src) {
      showToast(
        "This is a placeholder card — add a real project video to enable playback.",
      );
      return;
    }
    if (v.poster) videoModalPlayer.setAttribute("poster", v.poster);
    else videoModalPlayer.removeAttribute("poster");
    videoModalPlayer.src = v.src;
    videoModalPlayer.muted = false;
    videoModalPlayer.currentTime = 0;
    videoModalPlayer.play().catch(function () {});
    vmPlayIcon.innerHTML = ICON_PAUSE;
    vmMuteIcon.innerHTML = ICON_UNMUTE;
    videoModalOverlay.classList.add("active");
    document.documentElement.classList.add("no-scroll");
  }
  function closeVideoModal() {
    videoModalPlayer.pause();
    videoModalOverlay.classList.remove("active");
    document.documentElement.classList.remove("no-scroll");
  }
  videoModalClose.addEventListener("click", closeVideoModal);
  videoModalOverlay.addEventListener("click", function (e) {
    if (e.target === videoModalOverlay) closeVideoModal();
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") closeVideoModal();
  });

  vmPlayPause.addEventListener("click", function () {
    if (videoModalPlayer.paused) {
      videoModalPlayer.play();
      vmPlayIcon.innerHTML = ICON_PAUSE;
    } else {
      videoModalPlayer.pause();
      vmPlayIcon.innerHTML = ICON_PLAY;
    }
  });
  vmMute.addEventListener("click", function () {
    videoModalPlayer.muted = !videoModalPlayer.muted;
    vmMuteIcon.innerHTML = videoModalPlayer.muted ? ICON_MUTE : ICON_UNMUTE;
  });
  vmFullscreen.addEventListener("click", function () {
    if (videoModalPlayer.requestFullscreen)
      videoModalPlayer.requestFullscreen();
    else if (videoModalPlayer.webkitEnterFullscreen)
      videoModalPlayer.webkitEnterFullscreen();
  });

  /* ---------------------------------------------------------
     17. TESTIMONIAL SLIDER (buttons, dots, swipe, auto-play)
  --------------------------------------------------------- */
  (function testimonials() {
    var track = document.getElementById("testiTrack");
    var dotsWrap = document.getElementById("testiDots");
    var prevBtn = document.getElementById("testiPrev");
    var nextBtn = document.getElementById("testiNext");
    if (!track) return;

    track.innerHTML = TESTIMONIALS.map(function (t) {
      var stars = "";
      for (var i = 0; i < t.stars; i++) stars += starSvg();
      var initial = (t.name || "?").replace("[", "").charAt(0).toUpperCase();
      return (
        "" +
        '<div class="testi-slide">' +
        '<div class="testi-stars">' +
        stars +
        "</div>" +
        '<p class="quote">\u201C' +
        t.quote +
        "\u201D</p>" +
        '<div class="testi-person">' +
        '<div class="testi-avatar">' +
        initial +
        "</div>" +
        '<div><div class="name">' +
        t.name +
        '</div><div class="co">' +
        t.co +
        "</div></div>" +
        "</div>" +
        "</div>"
      );
    }).join("");

    dotsWrap.innerHTML = TESTIMONIALS.map(function (_, i) {
      return (
        '<span class="testi-dot' +
        (i === 0 ? " active" : "") +
        '" data-index="' +
        i +
        '"></span>'
      );
    }).join("");

    var index = 0;
    var total = TESTIMONIALS.length;
    var dots = dotsWrap.querySelectorAll(".testi-dot");
    var autoTimer;

    function goTo(i) {
      index = (i + total) % total;
      track.style.transform = "translateX(-" + index * 100 + "%)";
      dots.forEach(function (d, di) {
        d.classList.toggle("active", di === index);
      });
    }
    function startAuto() {
      if (prefersReducedMotion) return;
      clearInterval(autoTimer);
      autoTimer = setInterval(function () {
        goTo(index + 1);
      }, 6000);
    }

    prevBtn.addEventListener("click", function () {
      goTo(index - 1);
      startAuto();
    });
    nextBtn.addEventListener("click", function () {
      goTo(index + 1);
      startAuto();
    });
    dots.forEach(function (d) {
      d.addEventListener("click", function () {
        goTo(parseInt(d.getAttribute("data-index"), 10));
        startAuto();
      });
    });

    // touch swipe
    var touchStartX = 0;
    track.addEventListener(
      "touchstart",
      function (e) {
        touchStartX = e.touches[0].clientX;
      },
      { passive: true },
    );
    track.addEventListener(
      "touchend",
      function (e) {
        var dx = e.changedTouches[0].clientX - touchStartX;
        if (Math.abs(dx) > 40) {
          goTo(dx < 0 ? index + 1 : index - 1);
          startAuto();
        }
      },
      { passive: true },
    );

    goTo(0);
    startAuto();
  })();

  /* ---------------------------------------------------------
     18. CONTACT FORM — validation + fake-success (frontend only)
  --------------------------------------------------------- */
  (function contactForm() {
    var form = document.getElementById("contactForm");
    if (!form) return;
    var fields = document.getElementById("formFields");
    var success = document.getElementById("formSuccess");

    var validators = {
      fullName: function (v) {
        return v.trim().length > 1;
      },
      businessName: function (v) {
        return v.trim().length > 1;
      },
      phone: function (v) {
        return /^[0-9+()\-.\s]{7,}$/.test(v.trim());
      },
      email: function (v) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
      },
      category: function (v) {
        return v.trim().length > 1;
      },
      service: function (v) {
        return v.trim().length > 0;
      },
      description: function (v) {
        return v.trim().length > 4;
      },
    };

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var valid = true;
      Object.keys(validators).forEach(function (name) {
        var input = form.querySelector('[name="' + name + '"]');
        var wrap = input.closest(".field");
        var ok = validators[name](input.value || "");
        wrap.classList.toggle("invalid", !ok);
        if (!ok) valid = false;
      });
      if (!valid) {
        var firstInvalid = form.querySelector(
          ".field.invalid input, .field.invalid select, .field.invalid textarea",
        );
        if (firstInvalid) firstInvalid.focus();
        return;
      }

      var payload = {
        fullName: form.fullName.value.trim(),
        businessName: form.businessName.value.trim(),
        phone: form.phone.value.trim(),
        email: form.email.value.trim(),
        category: form.category.value.trim(),
        service: form.service.value,
        description: form.description.value.trim(),
      };

      var submitBtn = form.querySelector('button[type="submit"]');
      var originalLabel = submitBtn.innerHTML;
      submitBtn.disabled = true;
      submitBtn.textContent = "Sending…";

      fetch("/api/enquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
        .then(function (r) {
          return r.json().then(function (data) {
            return { ok: r.ok, data: data };
          });
        })
        .then(function (res) {
          if (!res.ok)
            throw new Error(res.data.error || "Could not send your enquiry.");
          fields.classList.add("hidden");
          success.classList.add("active");
          showToast("Enquiry sent — we\u2019ll be in touch shortly.");
        })
        .catch(function (err) {
          showToast(
            err.message ||
              "Something went wrong — please try again or WhatsApp us directly.",
          );
        })
        .finally(function () {
          submitBtn.disabled = false;
          submitBtn.innerHTML = originalLabel;
        });
    });

    // live re-validation
    Object.keys(validators).forEach(function (name) {
      var input = form.querySelector('[name="' + name + '"]');
      input.addEventListener("input", function () {
        var wrap = input.closest(".field");
        if (
          wrap.classList.contains("invalid") &&
          validators[name](input.value || "")
        ) {
          wrap.classList.remove("invalid");
        }
      });
    });
  })();

  /* ---------------------------------------------------------
     19. TOAST
  --------------------------------------------------------- */
  var toast = document.getElementById("toast");
  var toastMsg = document.getElementById("toastMsg");
  var toastTimer;
  function showToast(msg) {
    toastMsg.textContent = msg;
    toast.classList.add("active");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      toast.classList.remove("active");
    }, 3200);
  }

  /* ---------------------------------------------------------
     20. Helper: attach IntersectionObserver to freshly-injected
         .reveal elements (since some are rendered after initial load)
  --------------------------------------------------------- */
  function observeNewReveals(container) {
    var items = container.querySelectorAll(".reveal:not(.in-view)");
    if (prefersReducedMotion || !("IntersectionObserver" in window)) {
      items.forEach(function (el) {
        el.classList.add("in-view");
      });
      return;
    }
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("in-view");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" },
    );
    items.forEach(function (el) {
      io.observe(el);
    });
  }
})();
