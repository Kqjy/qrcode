let uploadform = document.querySelector("#uploadform");
var QRimage = document.getElementById('qrimage');
var Decodedresult = document.getElementById('decodedmessage');
uploadform.addEventListener("submit", function(event){
  event.preventDefault();
  var oldUploadFileInput = document.getElementById("uploadfile"); 
  const formData = new FormData();
  const fileField = document.getElementById('uploadfile');
  if (fileField.files.length == 0) {
    alert('Select a file!');
    return false;
  }
  Decodedresult.textContent = "Reading...";
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
    Decodedresult.textContent = data['result'];
    QRimage.src = URL.createObjectURL(oldUploadFileInput.files[0]);
    document.getElementById("uploadbutton").disabled = false;
    document.getElementById("uploadbutton").value = "Upload";
    oldUploadFileInput.value = "";
  }).catch((error) => {
    console.log(error)
    RaiseNotification(error);
    Decodedresult.textContent = ":( Something Went Wrong [Check Console]";
    document.getElementById("uploadbutton").disabled = false;
    document.getElementById("uploadbutton").value = "Upload Again?";
  });
});

function RaiseNotification(message) {
  noti = document.getElementById("notification");
  noti.style.display = "block";
  noti.style.background = "darkorange";
  var para = document.createElement('p');
  para.textContent = message;
  noti.appendChild(para);
}