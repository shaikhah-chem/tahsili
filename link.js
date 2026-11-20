/* 🔗 ربط «تحدّي التحصيلي» برصيدي الذهبي — تُرسل نتائج طالبات أ. شيخه المطيري للنقاط، وعدد شهادات طالبات الفصول الأخرى للإحصائية */
(function(){
  var MY = ["أول ج","أول د","أول هـ","ثاني ج","ثاني د"];   // فصول المعلمة
  var CFG = {apiKey:"AIzaSyBq067CBAa0tLJxNMf60nObygvnRTgYwlI",authDomain:"chem-lab-shaikha.firebaseapp.com",projectId:"chem-lab-shaikha",storageBucket:"chem-lab-shaikha.firebasestorage.app",messagingSenderId:"305599144472",appId:"1:305599144472:web:ae27c01b81b925c238d96d"};
  var COL = "tahsili_results", COL2 = "tahsili_others";
  var COURSE = /\/k21\//.test(location.pathname) ? "كيمياء 2-1" : /\/k22\//.test(location.pathname) ? "كيمياء 2-2" : /\/k3\//.test(location.pathname) ? "كيمياء 3" : "كيمياء 1";
  if (typeof results !== "function" || typeof store === "undefined") return;

  var db = null, loading = null;
  function load(src){ return new Promise(function(ok, no){ var s = document.createElement("script"); s.src = src; s.onload = ok; s.onerror = no; document.head.appendChild(s); }); }
  function getDb(){
    if (db) return Promise.resolve(db);
    if (!loading) loading = (window.firebase ? Promise.resolve() : load("https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js"))
      .then(function(){ return firebase.firestore ? null : load("https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore-compat.js"); })
      .then(function(){ var a = firebase.apps.find(function(x){ return x.name === "tahsili"; }) || firebase.initializeApp(CFG, "tahsili"); db = a.firestore(); return db; });
    return loading;
  }

  function cls(){ try { return localStorage.getItem("tahsili_cls") || store.get("cls", ""); } catch(e){ return store.get("cls", ""); } }
  function setCls(c){ store.set("cls", c); try { localStorage.setItem("tahsili_cls", c); } catch(e){} }
  function titleOf(k){ return /^l\d+/.test(k) ? "الدرس " + k.slice(1) : /^t/.test(k) ? "أسئلة التحصيلي" : k; }
  function askClass(after){
    if (document.getElementById("clsBox")) return;
    var box = document.createElement("div");
    box.id = "clsBox"; box.className = "nudge";
    box.innerHTML = '<label>هل أنتِ من طالبات أ. شيخه المطيري؟ اختاري فصلك ليُحتسب إنجازك في «رصيدي الذهبي»:</label>' +
      '<span style="display:flex;gap:8px;flex-wrap:wrap;margin-top:6px">' +
      MY.map(function(c){ return '<button class="btn" data-c="' + c + '">' + c + '</button>'; }).join("") +
      '<button class="btn ghost" data-c="other">فصل آخر</button></span>';
    app.insertAdjacentElement("afterbegin", box);
    box.onclick = function(e){
      var b = e.target.closest("button[data-c]"); if (!b) return;
      setCls(b.getAttribute("data-c")); box.remove();
      if (!prof().name) askName(after); else if (after) after();
    };
  }

  /* شهادات التميّز بنفس قاعدة صفحة «إنجازاتي»: 90% فأكثر في اختبار فصل/وحدة/الشامل + بلوغ أعلى مستوى */
  function certList(){
    var b = store.get("best", {}) || {}, out = [];
    Object.keys(b).forEach(function(k){
      if ((k[0] === "u" || k === "full" || /^c\d+$/.test(k)) && b[k] >= 90)
        out.push((typeof keyName === "function" && !/^c\d+$/.test(k) ? keyName(k) : (/^c\d+$/.test(k) ? "الفصل " + k.slice(1) : k)) + " (" + b[k] + "%)");
    });
    try { if (level(prof().xp).i === LEVELS.length - 1) out.push("بلوغ مستوى «بطلة التحصيلي»"); } catch(e){}
    return out;
  }
  function sendOthers(){
    var b = document.getElementById("nmBox"); if (b) b.remove();
    var name = (prof().name || "").trim(); if (!name) return;
    var list = certList();
    getDb().then(function(d){
      return d.collection(COL2).doc(("other_" + name + "_" + COURSE).replace(/[\/\s]+/g, "_")).set({name:name, course:COURSE, ts:Date.now(), certs:list.length, list:list.slice(0, 60)});
    }).catch(function(){});
  }

  function send(key, title, pct, all){
    var c = cls(), name = (prof().name || "").trim();
    if (c === "other") { if (name) sendOthers(); return; }
    if (MY.indexOf(c) < 0 || !name) return;
    var set = {};
    if (all) { Object.keys(all).forEach(function(k){ if (typeof all[k] === "number") set[k] = {pct:all[k], title:titleOf(k), at:Date.now()}; }); if (!Object.keys(set).length) return; }
    else set[key] = {pct:pct, title:title, at:Date.now()};
    getDb().then(function(d){
      return d.collection(COL).doc((c + "_" + name + "_" + COURSE).replace(/[\/\s]+/g, "_")).set({name:name, cls:c, course:COURSE, ts:Date.now(), sets:set}, {merge:true});
    }).catch(function(){});
  }

  var original = results;
  results = function(){
    var key = Q.key, title = Q.title, n = Q.list.length, pct = Math.round(Q.score / n * 100);
    var prevBest = (store.get("best", {}) || {})[key];
    var out = original.apply(this, arguments);
    try {
      if (prevBest == null || pct > prevBest) {
        var done = function(){ send(key, title, pct); var b = document.getElementById("nmBox"); if (b) b.remove(); };
        if (!cls()) askClass(done);
        else if (!prof().name) askName(done);
        else send(key, title, pct);
      }
    } catch(e){}
    return out;
  };

  /* عند الدخول: اسألي عن الفصل، ثم أرسلي كل الإنجازات السابقة المحفوظة على الجهاز */
  function backfill(){
    var b = document.getElementById("nmBox"); if (b) b.remove();
    send(null, null, null, store.get("best", {}) || {});
  }
  setTimeout(function(){
    try {
      if (!cls()) askClass(backfill);
      else { if (!prof().name) askName(backfill); else backfill(); }
    } catch(e){}
  }, 1200);
})();
