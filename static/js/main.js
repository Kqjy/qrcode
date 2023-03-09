let qrform = document.querySelector("#qrgenform");
var generatedQR = document.getElementsByClassName('generatedQR');
var QRimage = document.getElementById('qrimage');
var textareacon = document.getElementById('textinput');

qrform.addEventListener("submit", function(event){
  event.preventDefault();
  generatedQR[0].style.display = "block";
  if(textareacon.value.length < 1)
  {
      window.alert("Enter some text or URL.");
      return false;
  }
  QRimage.src = "/static/images/Loading.gif";
  document.getElementById("generatebutton").disabled = true;
  document.getElementById("generatebutton").value = "Generating...";
  fetch(qrform.action, {
      method: "post",
      body: new URLSearchParams(new FormData(qrform)) 
  }).then((response) => {
    if (response.ok) {
      return response.json();
    }
    throw new Error(response.statusText);
  }).then((data) => {
    QRimage.src = data['item'];
    document.getElementById("generatebutton").disabled = false;
    document.getElementById("generatebutton").value = "Generate";
    panel = document.getElementById("recentimagespanel");
    var div = document.createElement('div');
    var img = document.createElement('img');
    var btn = document.createElement('button');
    div.id = "recentimage" + data['id'];
    div.className = "recentimage";
    img.id = "recentqrimage" + data['id'];
    img.className = "recentqrimage";
    img.src = data['item'];
    btn.id = data['id'];
    btn.className = "deletebutton";
    btn.addEventListener("click", function() {DeleteQRImage(this.id);});
    btn.textContent = "Delete";
    panel.appendChild(div);
    paneldiv = document.getElementById("recentimage" + data['id']);
    paneldiv.appendChild(img);
    paneldiv.appendChild(btn);
    var noqrs = document.getElementById("noqrs");
    if (noqrs) {
      noqrs.style.display = "none";
    }
  }).catch((error) => {
    console.log(error)
    RaiseNotification(error);
    document.getElementById("generatebutton").disabled = false;
    document.getElementById("generatebutton").value = "Generate Again?";
  });
});

let uploadform = document.querySelector("#uploadform");
uploadform.addEventListener("submit", function(event){
  event.preventDefault();
  var oldUploadFileInput = document.getElementById("uploadfile"); 
  const formData = new FormData();
  const fileField = document.getElementById('uploadfile');
  if (fileField.files.length == 0) {
    alert('Select a file!');
    return false;
  }
  document.getElementById("uploadbutton").disabled = true;
  document.getElementById("uploadbutton").value = "Uploading...";
  formData.append("filename", fileField.files[0]);
  fetch(uploadform.action, {
      method: "post",
      body: formData
  }).then((response) => {
    if (response.ok) {
      return response.json();
    }
    throw new Error(response.statusText);
  }).then((data) => {
    oldUploadFileInput.value = "";
    panel = document.getElementById("logospanelimages");
    var div = document.createElement('div');
    var img = document.createElement('img');
    var btn = document.createElement('button');
    div.id = "logo" + data['id'];
    div.className = "recentimage";
    img.id = "logoimage" + data['id'];
    img.className = "recentqrimage";
    img.src = data['uploaded'];
    btn.id = data['id'];
    btn.className = "deletebutton";
    btn.addEventListener("click", function() {DeleteLogoImage(this.id);});
    btn.textContent = "Delete";
    panel.appendChild(div);
    paneldiv = document.getElementById("logo" + data['id']);
    paneldiv.appendChild(img);
    paneldiv.appendChild(btn);
    document.getElementById("uploadbutton").disabled = false;
    document.getElementById("uploadbutton").value = "Upload";
    var nologos = document.getElementById("nologos");
    if (nologos) {
      nologos.style.display = "none";
    }
  }).catch((error) => {
    console.log(error)
    RaiseNotification(error);
    document.getElementById("uploadbutton").disabled = false;
    document.getElementById("uploadbutton").value = "Upload Again?";
  });
});

function DeleteQRImage(clicked_id) {
  let id = clicked_id;
  document.getElementById("recentqrimage" + id).src = "/static/images/Loading.gif";
  document.getElementById(id).style.display = "none";
  const data = { filename: id };
  fetch("/api/deleteqr", {
      method: "post",
      body: JSON.stringify(data),
  }).then((response) => {
    if (response.ok) {
      return response.json();
    }
    throw new Error(response.statusText);
  }).then((data) => {
    console.log(data);
    document.getElementById("recentimage" + id).remove();
  }).catch((error) => {
    console.log(error)
    RaiseNotification(error);
    document.getElementById(id).style.display = "block";
  });
}

function DeleteLogoImage(clicked_id) {
  let id = clicked_id;
  document.getElementById("logoimage" + id).src = "/static/images/Loading.gif";
  document.getElementById(id).style.display = "none";
  const data = { filename: id };
  fetch("/api/deleteupload", {
      method: "post",
      body: JSON.stringify(data),
  }).then((response) => {
    if (response.ok) {
      return response.json();
    }
    throw new Error(response.statusText);
  }).then((data) => {
    console.log(data);
    document.getElementById("logo" + id).remove();
  }).catch((error) => {
    console.log(error)
    RaiseNotification(error);
    document.getElementById(id).style.display = "block";
  });
}

function RaiseNotification(message) {
  noti = document.getElementById("notification");
  noti.style.display = "block";
  noti.style.background = "darkorange";
  var para = document.createElement('p');
  para.textContent = message;
  noti.appendChild(para);
}