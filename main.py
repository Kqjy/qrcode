from flask import Flask, render_template, request, Response, jsonify
from deta import Deta
from PIL import Image, ImageColor

import segno
import numpy
import cv2

import os
import random
import string
import io
import json

deta = Deta(os.environ['DETA_PROJECT_KEY'])
drive = deta.Drive('Saved_Images')
uploaddrive = deta.Drive('Uploaded_Images')
app = Flask(__name__)

def randomurl(length):
   letters = string.ascii_lowercase + string.digits + string.ascii_uppercase
   return ''.join(random.choice(letters) for i in range(length))

def get_all_files(drive):
    getList = drive.list()
    all_files = getList.get("names")
    paging = getList.get("paging")
    last = paging.get("last") if paging else None
    while (last):
        getList = drive.list(last=last)
        all_files += getList.get("names")
        paging = getList.get("paging")
        last = paging.get("last") if paging else None
    return all_files

def GenerateQRCode(input, fcolor, bcolor, finderfcolor, finderbcolor, logo, art):
    qrname = randomurl(8) + ".png"
    output = io.BytesIO()
    qr = segno.make_qr(input, error='h')
    if art != "none":
        background_file = uploaddrive.get(art)
        if background_file is not None:
            qr.to_artistic(background=background_file, target=output, scale=4, kind='png', 
                        dark=fcolor, light=bcolor, finder_dark=finderfcolor, finder_light=finderbcolor)
            output.seek(0)
    else:
        qr.save(output, kind='PNG', scale=4, dark=fcolor, light=bcolor, finder_dark=finderfcolor, finder_light=finderbcolor)
    output.seek(0)
    if logo != "none":
        embeded_image = uploaddrive.get(logo)
        if embeded_image is not None:
            qr = Image.open(output)
            qr = qr.convert('RGB')
            output = io.BytesIO()
            img_width, img_height = qr.size
            logo_max_size = img_height // 3
            img = Image.open(embeded_image)
            img.thumbnail((logo_max_size, logo_max_size), Image.Resampling.LANCZOS)
            box = ((img_width - img.size[0]) // 2, (img_height - img.size[1]) // 2)
            qr.paste(img, box)
            qr.save(output, format="PNG")
            output.seek(0)
    drive.put(qrname, output, content_type='image/png')
    message = '{"item":"https://' + os.environ['DETA_SPACE_APP_HOSTNAME']  + '/qr/' + qrname +'", "id":"' + qrname + '"}'
    return message


@app.route('/', methods=["GET"])
def mainpage():
    getQRs = get_all_files(drive)
    getUploaded = get_all_files(uploaddrive)
    getNo_of_qrs = len(getQRs)
    getNo_of_uploaded_files = len(getUploaded)
    return render_template("main.html", files=getQRs, uploaded=getUploaded, lenqr=getNo_of_qrs, lenuploaded=getNo_of_uploaded_files)

@app.route('/read', methods=["GET"])
def readerpage():
    return render_template("reader.html")

@app.route('/upload/<url>', methods=["GET"])
def getUploadedFile(url):
    try:
        fname = uploaddrive.get(url)
        if fname is None:
            return render_template("errors/404.html"), 404
        filename = fname.read()
        return Response(filename, mimetype='image/*')
    except:
        return "Something went wrong"

@app.route('/qr/<url>', methods=["GET"])
def getQR(url):
    try:
        fname = drive.get(url)
        if fname is None:
            return render_template("errors/404.html"), 404
        filename = fname.read()
        return Response(filename, mimetype='image/png')
    except:
        return "Something went wrong"

## APIs

@app.route('/api/genqr', methods=["POST"])
def generateQR():
    input = request.form["textinput"]
    fcolor = request.form["fgcolor"]
    bcolor = request.form["bgcolor"]
    finderfcolor = request.form["finderfgcolor"]
    finderbcolor = request.form["finderbgcolor"]
    logo = request.form["logo"] 
    art = request.form["art"] 
    message = GenerateQRCode(input, fcolor, bcolor, finderfcolor, finderbcolor, logo, art)
    return message

@app.route('/api/deleteqr', methods=["POST"])
def deleteQR():
    input = json.loads(request.data, strict=False)
    drive.delete(input['filename'])
    message = '{"message":"Successfully Deleted."}'
    return message

@app.route('/api/deleteupload', methods=["POST"])
def deleteUpload():
    input = json.loads(request.data, strict=False)
    uploaddrive.delete(input['filename'])
    message = '{"message":"Successfully Deleted."}'
    return message

@app.route('/api/upload', methods=["POST"])
def uploadLogo():
    file = request.files["filename"]
    if file and file.filename:
        data = file.read()
        uploaddrive.put(file.filename, data)
        message = '{"uploaded":"https://' + os.environ['DETA_SPACE_APP_HOSTNAME']  + '/upload/' + file.filename +'", "id":"' + file.filename + '"}'
    else:
        message = '{"error":"No files provided."}'
    return message

@app.route('/api/readqr', methods=["POST"])
def uploadQR():
    file = request.files["filename"].read()
    if file:
        getimg = numpy.frombuffer(file, numpy.uint8)
        img = cv2.imdecode(getimg, cv2.IMREAD_GRAYSCALE)
        detector = cv2.QRCodeDetector()
        data, vertices_array, binary_qrcode = detector.detectAndDecode(img)
        if vertices_array is not None:
            result = data
        else:
            result = "Unable to read QR Code."
        message = '{"result":"' + result + '"}'
    else:
        message = '{"error":"No files provided."}'
    return message

## Actions


@app.route('/actions/generate', methods=["POST"])
@app.route('/actions/generate/', methods=["POST"])
def action_generateQR():
    getReq = request.data
    getReq = json.loads(getReq)
    input = getReq["text"]
    generate = json.loads(GenerateQRCode(input, "black", "white", "black", "white", "none", "none"))
    message = generate["item"]
    return message

@app.route('/__space/actions', methods=["GET"])
def actions():
    return {
        "actions": [
            {
                "name": "generate", 
                "title": "Quick Generate", 
                "path": "/actions/generate",
                "input": [
                    {
                        "name": "text",
                        "type": "string"
                    }
                ]
            }
        ]
    }