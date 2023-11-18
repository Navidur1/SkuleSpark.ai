from flask import Flask, render_template, session, redirect, url_for, flash, request, g
from flask_bootstrap import Bootstrap
from database import get_data_one
from bson.objectid import ObjectId
from database import get_data_one
from bson.objectid import ObjectId

app = Flask(__name__)

bootstrap = Bootstrap(app)

@app.route('/')
def index():
    return render_template("homepage.html")
                           
if __name__ == '__main__':
    app.run(debug=True)