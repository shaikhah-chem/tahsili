/* 🔗 ربط «تحدّي التحصيلي» برصيدي الذهبي — تُرسل نتائج طالبات أ. شيخه المطيري فقط */
(function(){
  var MY = ["أول ج","أول د","أول هـ","ثاني ج","ثاني د"];   // فصول المعلمة
  var CFG = {apiKey:"AIzaSyBq067CBAa0tLJxNMf60nObygvnRTgYwlI",authDomain:"chem-lab-shaikha.firebaseapp.com",projectId:"chem-lab-shaikha",storageBucket:"chem-lab-shaikha.firebasestorage.app",messagingSenderId:"305599144472",appId:"1:305599144472:web:ae27c01b81b925c238d96d"};
  var COL = "tahsili_results";
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

  function cls(){ return store.get("cls", ""); }
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
      store.set("cls", b.getAttribute("data-c")); box.remove();
      if (b.getAttribute("data-c") !== "other" && !prof().name) askName(after); else if (after) after();
    };
  }

  function send(key, title, pct){
    var c = cls(), name = (prof().name || "").trim();
    if (MY.indexOf(c) < 0 || !name) return;
    var set = {}; set[key] = {pct:pct, title:title, at:Date.now()};
    getDb().then(function(d){
      return d.collection(COL).doc((c + "_" + name).replace(/[\/\s]+/g, "_")).set({name:name, cls:c, course:COURSE, ts:Date.now(), sets:set}, {merge:true});
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
        else if (MY.indexOf(cls()) >= 0 && !prof().name) askName(done);
        else send(key, title, pct);
      }
    } catch(e){}
    return out;
  };
})();
