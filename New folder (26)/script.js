/* Print n' Loop: product popups, selected product calculators, and demo admin panel */
var $ = function(id){ return document.getElementById(id); };
var DEFAULT_ITEMS = [
  {id:"tarpaulin", name:"Tarpaulin printing", category:"Large format", description:"Banners and backdrops for events and shops."},
  {id:"dtf", name:"DTF printing", category:"Apparel", description:"Full-color transfers for shirts, caps and bags."},
  {id:"sublimation", name:"Sublimation printing", category:"Drinkware", description:"Vivid, long-lasting prints on custom items."},
  {id:"mugs", name:"Mugs", category:"Drinkware", description:"Custom photo and design mugs."},
  {id:"tumblers", name:"Tumblers", category:"Drinkware", description:"Personalized tumblers for gifts and teams."},
  {id:"caps", name:"Caps", category:"Apparel", description:"Custom caps with your logo."},
  {id:"tote-bags", name:"Tote bags", category:"Accessories", description:"Everyday bags printed with your art."},
  {id:"tshirts", name:"T-shirts", category:"Apparel", description:"Custom tees for groups and brands."},
  {id:"lanyards", name:"Lanyards", category:"Accessories", description:"Printed lanyards for events and offices."},
  {id:"button-pins", name:"Button pins", category:"Accessories", description:"Round pins for giveaways and events."},
  {id:"keychains", name:"Keychains", category:"Accessories", description:"Custom keychains in any batch size."},
  {id:"stickers", name:"Stickers", category:"Paper", description:"Custom stickers for packaging, laptops and gifts."},
  {id:"refrigerator-magnets", name:"Refrigerator magnets", category:"Accessories", description:"Custom magnets for photos, promotions and souvenirs."},
  {id:"card-stock", name:"Card stock", category:"Paper", description:"Printed card stock for invitations, inserts and small cards."},
  {id:"pvc", name:"PVC cards", category:"Cards", description:"Durable PVC cards for IDs, memberships and promotions."},
  {id:"business-cards", name:"Business cards", category:"Paper", description:"Cards printed for your brand."},
  {id:"hang-tags", name:"Hang tags", category:"Paper", description:"Tags for clothing and product lines."}
];
var ITEMS_KEY = "printnloop_products_v2";
/* Admin panel address: open  <site address>#admin2600  (plain #admin shows the home page). */
var ADMIN_HASH = "admin2600";
/* Admin password check (PBKDF2-SHA256, runs in the browser). To change the password, replace ADMIN_PW_HASH with a new hash. */
var ADMIN_SALT = "2d2ecd37617102f0340d76ad22c784c4";
var ADMIN_PW_HASH = "f1f85995b1bf4e9fcf487a0093205e9dedafde65078b082b5ada8ff49613d089";
var ADMIN_SESSION_KEY = "printnloop_admin_ok", adminUnlockedMem = false;
function isAdminUnlocked(){ try { return sessionStorage.getItem(ADMIN_SESSION_KEY)==="1"; } catch(e) { return adminUnlockedMem; } }
function setAdminUnlocked(on){ adminUnlockedMem=!!on; try { if(on) sessionStorage.setItem(ADMIN_SESSION_KEY,"1"); else sessionStorage.removeItem(ADMIN_SESSION_KEY); } catch(e) {} }
function hashPassword(pw){
  var enc=new TextEncoder();
  return crypto.subtle.importKey("raw",enc.encode(pw),"PBKDF2",false,["deriveBits"]).then(function(key){
    return crypto.subtle.deriveBits({name:"PBKDF2",salt:enc.encode(ADMIN_SALT),iterations:200000,hash:"SHA-256"},key,256);
  }).then(function(bits){ return Array.from(new Uint8Array(bits)).map(function(b){return b.toString(16).padStart(2,"0");}).join(""); });
}
function setHashQuietly(h){
  // Some browsers (notably when the site is opened as a local file) refuse history.replaceState; fall back safely.
  try { history.replaceState(null,"",h); }
  catch(e) { try { location.hash=h; } catch(e2) {} }
}
var items = loadItems();
var grid = $("grid"), modal = $("productModal"), lastFocusedCard = null, activeProduct = null;

function loadItems(){
  try { var saved = JSON.parse(localStorage.getItem(ITEMS_KEY)); if(Array.isArray(saved)) return saved; } catch(e) {}
  return DEFAULT_ITEMS.slice();
}
function saveItems(){
  try { localStorage.setItem(ITEMS_KEY, JSON.stringify(items)); return true; }
  catch(e) { return false; }
}
var STORAGE_FULL_MSG = "Could not save: the browser storage is full. Try a smaller photo or remove a product photo.";
function isCalculatorProduct(item){
  var n=(item.name||"").toLowerCase();
  return n.includes("button pin") || n.includes("sticker") || n.includes("magnet") || n.includes("card stock") || n.includes("business card") || n.includes("pvc") || n.includes("tarpaulin") || n.includes("tarpolin");
}
function route(){
  var h=(location.hash||"").replace("#","");
  if(h===ADMIN_HASH) h="admin"; else if(h==="admin") h="home";   // only #admin2600 opens the admin panel
  if(["products","howtoorder","contact","admin"].indexOf(h)<0) h="home";
  ["home","products","howtoorder","contact","admin"].forEach(function(v){ var el=$("v-"+v); if(el) el.classList.toggle("on",v===h); });
  document.querySelectorAll('header nav a[data-v]').forEach(function(a){ if(a.dataset.v===h) a.setAttribute("aria-current","page"); else a.removeAttribute("aria-current"); });
  var TITLES={home:"Print n’ Loop | Custom printing, mugs, stickers, tarpaulin and more",products:"Products | Print n’ Loop",howtoorder:"How to order | Print n’ Loop",contact:"Contact | Print n’ Loop",admin:"Admin | Print n’ Loop"};
  document.title=TITLES[h]||TITLES.home;
  if(h==="admin") updateAdminVisibility();
  window.scrollTo(0,0);
}
addEventListener("hashchange",route);

function renderProducts(){
  grid.innerHTML="";
  items.forEach(function(item){
    var li=document.createElement("li"); li.className="card"; li.dataset.cat=item.category; li.tabIndex=0; li.setAttribute("role","button"); li.setAttribute("aria-label","View details for "+item.name);
    var art=document.createElement("div"); art.className="art";
    if(item.image){ var img=document.createElement("img"); img.src=item.image; img.alt=item.name; img.loading="lazy"; img.onerror=function(){art.textContent=(item.name||"P").charAt(0);}; art.appendChild(img); }
    else art.textContent=(item.name||"P").charAt(0);
    var txt=document.createElement("div"); txt.className="txt";
    var cat=document.createElement("span"); cat.className="cat"; cat.textContent=item.category||"Product";
    var h3=document.createElement("h3"); h3.textContent=item.name;
    var p=document.createElement("p"); p.textContent=item.description;
    var price=document.createElement("p"); price.className="product-card-price"; price.textContent=priceText(item);
    txt.appendChild(cat); txt.appendChild(h3); txt.appendChild(p); txt.appendChild(price); li.appendChild(art); li.appendChild(txt);
    li.addEventListener("click",function(){openProduct(item,li);});
    li.addEventListener("keydown",function(e){if(e.key==="Enter"||e.key===" "){e.preventDefault();openProduct(item,li);}});
    grid.appendChild(li);
  });
  renderFilters(); renderAdminList();
}
function renderFilters(){
  var chips=$("chips"); chips.innerHTML="";
  var cats=["All"].concat(items.map(function(i){return i.category||"Product";}).filter(function(v,i,a){return a.indexOf(v)===i;}));
  cats.forEach(function(c,n){var b=document.createElement("button"); b.className="chip"; b.type="button"; b.textContent=c; b.setAttribute("aria-pressed",n===0); b.onclick=function(){chips.querySelectorAll(".chip").forEach(function(x){x.setAttribute("aria-pressed",x===b);});grid.querySelectorAll(".card").forEach(function(card){card.hidden=!(c==="All"||card.dataset.cat===c);});};chips.appendChild(b);});
}
function formatPrice(value){
  if(value===undefined||value===null||value===""||!Number.isFinite(Number(value))) return "Contact us for pricing";
  return "₱"+Number(value).toLocaleString("en-PH",{minimumFractionDigits:2,maximumFractionDigits:2});
}
function pricingData(item){
  if(item.pricingTable===false) return null;
  if(item.pricingTable && Array.isArray(item.pricingTable.columns) && Array.isArray(item.pricingTable.rows) && item.pricingTable.rows.length) return item.pricingTable;
  var n=(item.name||"").toLowerCase();
  if(n.includes("button pin")) return {
    title:"Button pin price list", columns:["Type / size","5–49 pcs","50–499 pcs","500+ pcs"],
    rows:[
      ["Standard glossy · 58 mm","₱40.00","₱20.00","₱15.00"],
      ["Standard glossy · 32 mm","₱26.00","₱13.00","₱10.00"],
      ["Standard glossy · 25 mm","₱16.00","₱8.00","₱6.00"],
      ["Special · 58 mm","₱43.00","₱23.00","₱18.00"],
      ["Special · 32 mm","₱29.00","₱16.00","₱13.00"],
      ["Special · 25 mm","₱19.00","₱11.00","₱9.00"]]};
  if(n.includes("sticker")) return {
    title:"Sticker price list", columns:["Style / size","30–149 pcs","150–1,499 pcs","1,500+ pcs"],
    rows:[
      ["No photo top · 1×1 in","₱1.20","₱0.60","₱0.50"],["No photo top · 2×2 in","₱4.80","₱2.40","₱2.00"],["No photo top · 3×3 in","₱10.80","₱5.40","₱4.50"],["No photo top · custom (per sq. in.)","₱1.20","₱0.60","₱0.50"],
      ["Standard photo top · 1×1 in","₱1.60","₱0.80","₱0.70"],["Standard photo top · 2×2 in","₱6.40","₱3.20","₱2.80"],["Standard photo top · 3×3 in","₱14.40","₱7.20","₱6.30"],["Special photo top · 1×1 in","₱3.00","₱1.50","₱1.40"],["Special photo top · 2×2 in","₱12.00","₱6.00","₱5.60"],["Special photo top · 3×3 in","₱27.00","₱13.50","₱12.40"]]};
  if(n.includes("magnet")) return {
    title:"Refrigerator magnet price list", columns:["Type","5–24 pcs","25–249 pcs","250+ pcs"],
    rows:[["ATM size · 1 side · 0.5 mm","₱22.00","₱11.00","₱10.00"],["ATM size · 1 side · 1 mm","₱32.00","₱16.00","₱15.00"],["1 × 1 in · 1 side · 0.5 mm","₱4.00","₱2.00","₱1.50"],["1 × 1 in · 1 side · 1 mm","₱5.00","₱3.00","₱2.50"],["ATM size · 2 sides · 0.5 mm","₱23.50","₱12.50","₱11.50"],["ATM size · 2 sides · 1 mm","₱33.50","₱17.50","₱16.50"],["1 × 1 in · 2 sides · 0.5 mm","₱5.00","₱2.50","₱2.00"],["1 × 1 in · 2 sides · 1 mm","₱6.00","₱3.50","₱3.00"]]};
  if(n.includes("business card")) return {
    title:"Business card price list", columns:["Style","10–49 pcs","50–499 pcs","500+ pcs"],
    rows:[["No photo top · 1 side","₱6.00","₱3.00","₱2.50"],["Standard photo top · 1 side","₱7.00","₱3.50","₱3.00"],["Special photo top · 1 side","₱13.00","₱6.50","₱6.00"],["No photo top · 2 sides","₱9.00","₱4.50","₱4.00"],["Standard photo top · 2 sides","₱10.00","₱5.00","₱4.50"],["Special photo top · 2 sides","₱16.00","₱8.00","₱7.50"]]};
  return null;
}
function renderPricingTable(item){
  var old=$("productPricingTable"); if(old) old.remove();
  var data=pricingData(item); if(!data) return;
  var wrap=document.createElement("section"); wrap.id="productPricingTable"; wrap.className="pricing-table-wrap";
  var title=document.createElement("h3"); title.textContent=data.title; wrap.appendChild(title);
  var scroller=document.createElement("div"); scroller.className="pricing-table-scroll";
  var table=document.createElement("table"); table.className="pricing-table";
  var thead=document.createElement("thead"), tr=document.createElement("tr");
  data.columns.forEach(function(c){var th=document.createElement("th");th.textContent=c;tr.appendChild(th);}); thead.appendChild(tr);table.appendChild(thead);
  var tbody=document.createElement("tbody"); data.rows.forEach(function(row){var r=document.createElement("tr");row.forEach(function(value){var td=document.createElement("td");td.textContent=value;r.appendChild(td);});tbody.appendChild(r);});table.appendChild(tbody);scroller.appendChild(table);wrap.appendChild(scroller);
  var note=document.createElement("p");note.className="calculator-hint";note.textContent="Prices are per piece and depend on the selected style and order quantity. Turnaround time is confirmed when you message us.";wrap.appendChild(note);
  $("modalDescription").insertAdjacentElement("afterend",wrap);
}
function priceText(item){
  // Products with a price table show the real range (lowest to highest per-piece rate); otherwise the saved price.
  var data=pricingData(item), lo=null, hi=null;
  if(data){ data.rows.forEach(function(r){ r.slice(1).forEach(function(v){ if(!/^\s*[₱P]?\s*\d[\d,]*(\.\d+)?\s*$/.test(String(v))) return; var n=parseFloat(String(v).replace(/[^0-9.]/g,"")); if(!isFinite(n)||n<=0) return; if(lo===null||n<lo) lo=n; if(hi===null||n>hi) hi=n; }); }); }
  if(lo!==null) return lo===hi ? formatPrice(lo)+" / pc" : formatPrice(lo)+" – "+formatPrice(hi)+" / pc";
  return formatPrice(item.price);
}
var modalPriceText=priceText;
function openProduct(item,card){
  activeProduct=item; lastFocusedCard=card;
  $("modalArt").innerHTML="";
  if(item.image){var img=document.createElement("img");img.src=item.image;img.alt=item.name;$("modalArt").appendChild(img);}else{$("modalArt").textContent=(item.name||"P").charAt(0);}
  $("modalCategory").textContent=item.category||"Product"; $("modalTitle").textContent=item.name; $("modalDescription").textContent=item.description||"Custom printed product."; $("modalPrice").textContent=modalPriceText(item);
  $("modalOrder").setAttribute("data-product",item.name); $("modalOrder").href="https://ig.me/m/printnloop.2601"; $("modalOrder").textContent="Message us on Instagram to order"; $("modalOrder").target="_blank"; $("modalOrder").rel="noopener";
  renderPricingTable(item);
  buildCalculator(item);
  modal.classList.add("open"); modal.setAttribute("aria-hidden","false"); document.body.classList.add("modal-open"); setBackgroundInert(true); modal.querySelector(".modal-close").focus();
}
function setBackgroundInert(on){ ["header","main","footer"].forEach(function(sel){ var el=document.querySelector(sel); if(!el) return; if(on) el.setAttribute("inert",""); else el.removeAttribute("inert"); }); }
function closeProduct(){modal.classList.remove("open");modal.setAttribute("aria-hidden","true");document.body.classList.remove("modal-open");setBackgroundInert(false);if(lastFocusedCard)lastFocusedCard.focus();}
modal.querySelectorAll("[data-close-modal]").forEach(function(el){el.addEventListener("click",closeProduct);});
modal.querySelector(".modal-close").addEventListener("click",closeProduct);
document.addEventListener("keydown",function(e){if(e.key==="Escape"&&modal.classList.contains("open"))closeProduct();});

function buildCalculator(item){
  var box=$("productCalculator"), fields=$("calculatorFields"); fields.innerHTML=""; $("calculatorResult").textContent="";
  box.hidden=!isCalculatorProduct(item); if(box.hidden) return;
  var name=item.name.toLowerCase();
  var qty=document.createElement("div"); qty.className="calculator-row one";
  qty.innerHTML='<div><label for="calcQty">Quantity</label><input id="calcQty" type="number" min="1" step="1" value="1"></div>';
  fields.appendChild(qty);
  if(name.includes("button pin")){
    var size=document.createElement("div"); size.className="calculator-row one"; size.innerHTML='<div><label for="calcDiameter">Pin diameter</label><select id="calcDiameter"><option value="1.5">1.5 inches</option><option value="2.25" selected>2.25 inches</option><option value="3">3 inches</option></select></div>';
    fields.appendChild(size);
    var hint=document.createElement("p"); hint.className="calculator-hint"; hint.textContent="This shows your selected size and quantity. See the price table for per-piece rates, and check the minimum quantity for each tier. Final pricing is confirmed by Print n’ Loop."; fields.appendChild(hint);
  } else {
    var presets="";
    if(name.includes("business card")) presets='<div><label for="calcPreset">Business card size</label><select id="calcPreset"><option value="3.5,2">Standard US (3.5 × 2 in)</option><option value="3.54,2.13">90 × 54 mm (approx. 3.54 × 2.13 in)</option><option value="custom">Custom size</option></select></div>';
    else if(name.includes("card stock")) presets='<div><label for="calcPreset">Common size (optional)</label><select id="calcPreset"><option value="custom">Custom size</option><option value="8.27,11.69">A4 (8.27 × 11.69 in)</option><option value="5.83,8.27">A5 (5.83 × 8.27 in)</option><option value="4.13,5.83">A6 (4.13 × 5.83 in)</option></select></div>';
    var dimensions=document.createElement("div"); dimensions.className="calculator-row";
    dimensions.innerHTML='<div><label for="calcWidth">Width</label><input id="calcWidth" type="number" min="0.01" step="any" value="3"></div><div><label for="calcHeight">Height</label><input id="calcHeight" type="number" min="0.01" step="any" value="2"></div>';
    fields.appendChild(dimensions);
    var unit=document.createElement("div"); unit.className="calculator-row one"; unit.innerHTML='<div><label for="calcUnit">Measurement unit</label><select id="calcUnit"><option value="in">Inches</option><option value="cm">Centimeters</option><option value="ft">Feet</option></select></div>'+presets;
    fields.appendChild(unit);
    if(name.includes("card stock") || name.includes("business card")){
      var preset=$("calcPreset"); preset.addEventListener("change",function(){if(preset.value!=="custom"){var d=preset.value.split(",");$("calcWidth").value=d[0];$("calcHeight").value=d[1];$("calcUnit").value="in";} });
    }
    var hint2=document.createElement("p"); hint2.className="calculator-hint"; hint2.textContent=pricingData(item)?"Calculates the print area for your size and quantity. See the price table for per-piece rates, and check the minimum quantity for each tier.":"Calculates the print area for your size and quantity. Message us for a price quote."; fields.appendChild(hint2);
  }
  $("calculateProduct").onclick=calculateSelectedProduct;
  ["calcQty","calcDiameter","calcWidth","calcHeight","calcUnit","calcPreset"].forEach(function(id){var el=$(id);if(el)el.addEventListener("input",calculateSelectedProduct);});
  calculateSelectedProduct();
}
function calculateSelectedProduct(){
  if(!activeProduct)return;
  var name=activeProduct.name.toLowerCase(), rawQty=Number($("calcQty").value), result="";
  if(!(rawQty>=1) || Math.floor(rawQty)!==rawQty){ $("calculatorResult").textContent="Enter a whole number of 1 or more for the quantity."; return; }
  var qty=rawQty;
  if(name.includes("button pin")){
    var d=parseFloat($("calcDiameter").value)||2.25; result=qty+" button pin(s) · "+d+" inch diameter. Final price will be confirmed by the shop.";
  }else{
    var w=parseFloat($("calcWidth").value)||0,h=parseFloat($("calcHeight").value)||0,u=$("calcUnit").value;
    if($("calcPreset")&&$("calcPreset").value!=="custom"){var preset=$("calcPreset").value.split(",");w=parseFloat(preset[0]);h=parseFloat(preset[1]);u="in";}
    if(w<=0||h<=0){$("calculatorResult").textContent="Enter a width and height greater than zero.";return;}
    var factor=u==="ft"?1:u==="in"?1/144:1/929.0304;
    var each=w*h*factor,total=each*qty;
    result=w+" × "+h+" "+u+" each · "+qty+" item(s) · "+each.toFixed(3)+" sq ft each · "+total.toFixed(3)+" sq ft total. Price is confirmed when you message us.";
  }
  $("calculatorResult").textContent=result;
}

/* Admin panel: hidden from customer navigation. This is a local-only demo. */
var editingProductId = null;
var currentFormImage = "";
var tableState = null, tableRemoved = false;
function updateAdminVisibility(){
  var ok=isAdminUnlocked(); $("adminLogin").hidden=ok; $("adminDashboard").hidden=!ok;
  if(ok) renderAdminList(); else { $("adminPassword").value=""; $("adminLoginMessage").textContent=""; }
}
function resetProductForm(){
  $("productForm").reset(); editingProductId=null; currentFormImage=""; tableState=null; tableRemoved=false; renderTableEditor();
  $("productFormHeading").textContent="Add a product";
  $("productSubmitButton").textContent="Add product";
  $("cancelProductEdit").hidden=true;
  $("removeProductImage").checked=false;
}
function compressUploadedImage(file){
  return new Promise(function(resolve,reject){
    if(!file || !file.type || file.type.indexOf("image/")!==0){reject(new Error("Please choose an image file."));return;}
    var reader=new FileReader();
    reader.onerror=function(){reject(new Error("Could not read that photo. Please try another one."));};
    reader.onload=function(){
      var img=new Image();
      img.onerror=function(){reject(new Error("That image could not be opened. Please try another photo."));};
      img.onload=function(){
        var max=1200, scale=Math.min(1,max/Math.max(img.width,img.height));
        var canvas=document.createElement("canvas"); canvas.width=Math.max(1,Math.round(img.width*scale)); canvas.height=Math.max(1,Math.round(img.height*scale));
        var ctx=canvas.getContext("2d"); ctx.drawImage(img,0,0,canvas.width,canvas.height);
        var data=canvas.toDataURL("image/jpeg",0.78);
        if(data.length>1800000){data=canvas.toDataURL("image/jpeg",0.58);}
        resolve(data);
      };
      img.src=reader.result;
    };
    reader.readAsDataURL(file);
  });
}
$("adminLogout").addEventListener("click",function(){ resetProductForm(); setAdminUnlocked(false); location.hash="#home"; });
$("adminLogin").addEventListener("submit",function(e){
  e.preventDefault();
  var msg=$("adminLoginMessage"), btn=$("adminLoginButton");
  if(!(window.crypto&&crypto.subtle)){ msg.textContent="This browser can't check passwords here. Open the site over https."; return; }
  btn.disabled=true; msg.textContent="Checking…";
  hashPassword($("adminPassword").value).then(function(h){
    if(h===ADMIN_PW_HASH){ setAdminUnlocked(true); updateAdminVisibility(); }
    else { msg.textContent="Wrong password."; $("adminPassword").value=""; setTimeout(function(){btn.disabled=false;},1500); return; }
    btn.disabled=false;
  }).catch(function(){ msg.textContent="Could not check the password."; btn.disabled=false; });
});
$("cancelProductEdit").addEventListener("click",function(){resetProductForm();$("adminPostMessage").textContent="Edit cancelled.";});
$("productForm").addEventListener("submit",async function(e){
  e.preventDefault();
  var name=$("newProductName").value.trim(),category=$("newProductCategory").value.trim(),description=$("newProductDescription").value.trim(),priceValue=$("newProductPrice").value;
  if(!name||!category||!description)return;
  var price=priceValue===""?null:Number(priceValue), image=currentFormImage;
  var file=$("newProductImage").files[0];
  var submit=$("productSubmitButton"); submit.disabled=true; $("adminPostMessage").textContent="Saving product…";
  try{
    if(file) image=await compressUploadedImage(file);
    if($("removeProductImage").checked) image="";
    var tableFields=collectTableFields(name);
    if(editingProductId){
      var before=items;
      items=items.map(function(p){return p.id===editingProductId?Object.assign({},p,{name:name,category:category,description:description,price:price,image:image},tableFields):p;});
      if(!saveItems()){ items=before; throw new Error(STORAGE_FULL_MSG); }
      renderProducts();resetProductForm();$("adminPostMessage").textContent="Product updated successfully.";
    }else{
      var added=Object.assign({id:"custom-"+Date.now(),name:name,category:category,description:description,price:price,image:image},tableFields);
      items.push(added);
      if(!saveItems()){ items.pop(); throw new Error(STORAGE_FULL_MSG); }
      renderProducts();resetProductForm();$("adminPostMessage").textContent="Product added to the customer product list.";
    }
  }catch(err){$("adminPostMessage").textContent=err.message||"Could not save this product. Try a smaller photo.";}
  finally{submit.disabled=false;}
});
function beginEditProduct(item){
  editingProductId=item.id; currentFormImage=item.image||"";
  $("newProductName").value=item.name||""; $("newProductCategory").value=item.category||""; $("newProductDescription").value=item.description||""; $("newProductPrice").value=item.price===null||item.price===undefined?"":item.price;
  $("newProductImage").value=""; $("removeProductImage").checked=false;
  var existing=pricingData(item); tableState=existing?JSON.parse(JSON.stringify({title:existing.title||"",columns:existing.columns,rows:existing.rows})):null; tableRemoved=false; renderTableEditor();
  $("productFormHeading").textContent="Edit product: "+item.name; $("productSubmitButton").textContent="Save changes"; $("cancelProductEdit").hidden=false;
  $("adminPostMessage").textContent=currentFormImage?"Current photo kept unless you upload a new one or select Remove current photo.":"No photo uploaded yet. You can upload one below.";
  $("productForm").scrollIntoView({behavior:"smooth",block:"start"}); $("newProductName").focus();
}
function renderAdminList(){
  var list=$("adminProductList"); if(!list)return; list.innerHTML="";
  items.forEach(function(item){
    var li=document.createElement("li"),info=document.createElement("div"),title=document.createElement("strong"),desc=document.createElement("p"),actions=document.createElement("div"),edit=document.createElement("button"),del=document.createElement("button");
    title.textContent=item.name; desc.textContent=(item.category||"Product")+" · "+(item.description||"")+" · "+formatPrice(item.price)+(item.image?" · Photo added":" · No photo");
    info.appendChild(title);info.appendChild(desc);
    edit.type="button";edit.className="btn l s";edit.textContent="Edit";edit.addEventListener("click",function(){beginEditProduct(item);});
    del.type="button";del.className="btn l s";del.textContent="Delete";del.addEventListener("click",function(){if(!confirm("Delete “"+item.name+"” from the product list?"))return;var prev=items;items=items.filter(function(p){return p.id!==item.id;});if(!saveItems()){items=prev;alert(STORAGE_FULL_MSG);return;}renderProducts();if(editingProductId===item.id)resetProductForm();});
    actions.className="admin-product-actions";actions.appendChild(edit);actions.appendChild(del);li.appendChild(info);li.appendChild(actions);list.appendChild(li);
  });
}

$("modalOrder").addEventListener("click",function(){if(modal.classList.contains("open"))closeProduct();});
renderProducts();route();

/* Published product list: customers load products.json (if it exists next to index.html).
   The admin's browser keeps a local draft until "Use published list" is pressed. */
function loadPublishedList(){
  return fetch("products.json",{cache:"no-store"}).then(function(r){return r.ok?r.json():null;}).then(function(data){
    if(Array.isArray(data)&&data.length){ items=data; renderProducts(); return true; }
    return false;
  }).catch(function(){ return false; });
}
var hasLocalDraft=false; try{ hasLocalDraft=localStorage.getItem(ITEMS_KEY)!==null; }catch(e){}
if(!hasLocalDraft) loadPublishedList();

/* Admin: download the current list as products.json, or discard the local draft */
$("exportProducts").addEventListener("click",function(){
  var blob=new Blob([JSON.stringify(items,null,2)],{type:"application/json"});
  var a=document.createElement("a"); a.href=URL.createObjectURL(blob); a.download="products.json";
  document.body.appendChild(a); a.click(); a.remove(); setTimeout(function(){URL.revokeObjectURL(a.href);},1000);
  $("adminPostMessage").textContent="products.json downloaded. Upload it next to index.html on your host to show these products to customers.";
});
$("usePublished").addEventListener("click",function(){
  if(!confirm("Discard the changes saved in this browser and reload the published product list?"))return;
  try{ localStorage.removeItem(ITEMS_KEY); }catch(e){}
  items=DEFAULT_ITEMS.slice(); renderProducts(); resetProductForm();
  loadPublishedList().then(function(ok){ $("adminPostMessage").textContent=ok?"Loaded the published product list.":"No products.json found, showing the built-in list."; });
});

/* Admin price table editor */
function renderTableEditor(){
  var body=$("tableEditorBody"), toggle=$("tableEditorToggle"); if(!body) return;
  body.hidden=!tableState; toggle.hidden=!!tableState;
  if(!tableState) return;
  $("tableTitle").value=tableState.title||"";
  var grid=$("tableEditorGrid"); grid.innerHTML="";
  function cellInput(value,label,onInput){var i=document.createElement("input");i.type="text";i.value=value;i.setAttribute("aria-label",label);i.addEventListener("input",function(){onInput(i.value);});return i;}
  function removeBtn(label,fn){var b=document.createElement("button");b.type="button";b.className="table-x";b.textContent="×";b.setAttribute("aria-label",label);b.addEventListener("click",fn);return b;}
  var thead=document.createElement("thead"), hr=document.createElement("tr");
  tableState.columns.forEach(function(col,ci){
    var th=document.createElement("th");
    th.appendChild(cellInput(col,"Column "+(ci+1)+" heading",function(v){tableState.columns[ci]=v;}));
    if(tableState.columns.length>2) th.appendChild(removeBtn("Remove column "+(ci+1),function(){tableState.columns.splice(ci,1);tableState.rows.forEach(function(r){r.splice(ci,1);});renderTableEditor();}));
    hr.appendChild(th);
  });
  hr.appendChild(document.createElement("th")); thead.appendChild(hr); grid.appendChild(thead);
  var tbody=document.createElement("tbody");
  tableState.rows.forEach(function(row,ri){
    var tr=document.createElement("tr");
    tableState.columns.forEach(function(_,ci){
      var td=document.createElement("td");
      td.appendChild(cellInput(row[ci]||"","Row "+(ri+1)+", "+(tableState.columns[ci]||"column "+(ci+1)),function(v){row[ci]=v;}));
      tr.appendChild(td);
    });
    var tdx=document.createElement("td"); tdx.appendChild(removeBtn("Remove row "+(ri+1),function(){tableState.rows.splice(ri,1);renderTableEditor();})); tr.appendChild(tdx);
    tbody.appendChild(tr);
  });
  grid.appendChild(tbody);
}
function collectTableFields(productName){
  if(!tableState) return tableRemoved?{pricingTable:false}:{};
  var cols=tableState.columns.map(function(c){return String(c).trim();});
  var rows=tableState.rows.map(function(r){return cols.map(function(_,i){return String(r[i]||"").trim();});}).filter(function(r){return r.some(function(c){return c;});});
  if(!rows.length) return tableRemoved?{pricingTable:false}:{};
  var title=($("tableTitle").value||"").trim()||(productName+" price list");
  return {pricingTable:{title:title,columns:cols.map(function(c,i){return c||"Column "+(i+1);}),rows:rows}};
}
$("tableEditorToggle").addEventListener("click",function(){tableState={title:"",columns:["Type / size","Quantity 1","Quantity 2"],rows:[["","",""]]};tableRemoved=false;renderTableEditor();$("tableTitle").focus();});
$("tableTitle").addEventListener("input",function(){if(tableState)tableState.title=$("tableTitle").value;});
$("tableAddRow").addEventListener("click",function(){tableState.rows.push(tableState.columns.map(function(){return "";}));renderTableEditor();});
$("tableAddCol").addEventListener("click",function(){tableState.columns.push("");tableState.rows.forEach(function(r){r.push("");});renderTableEditor();});
$("tableRemove").addEventListener("click",function(){tableState=null;tableRemoved=true;renderTableEditor();});


/* Light / dark theme toggle (remembers the choice; defaults to the device setting) */
(function(){
  var btn=document.getElementById("themeToggle"); if(!btn) return;
  function current(){ return document.documentElement.getAttribute("data-theme")==="dark" ? "dark" : "light"; }
  function sync(){ btn.setAttribute("aria-label", current()==="dark" ? "Switch to light mode" : "Switch to dark mode"); }
  btn.addEventListener("click", function(){
    var next = current()==="dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    try { localStorage.setItem("printnloop_theme", next); } catch(e) {}
    sync();
  });
  sync();
})();


var yearEl=document.getElementById("year"); if(yearEl) yearEl.textContent=new Date().getFullYear();
