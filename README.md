# Cipher Safe for Android and iOS

This project was created to compliment an article I wrote on [AirPair.com](http://www.airpair.com).  It demonstrates how to use the Forge JavaScript cipher-text library and Firebase to create a 1Password, LastPass, or KeePass competitor with Ionic Framework.


## Requirements

* Apache Cordova 4.0+
* Firebase 2.2.2+
* AngularFire 1.0.0+
* Ionic CLI 1.3.11+


## Configuration

Download this example project from GitHub and run the following commands:

    $ ionic platform add android

The above command will add the Android build platform.

This application requires you to have your own Firebase instance registered with **Email & Password** authentication enabled.  
Firebase permissions must be set as follows in the **Security & Roles** section:

    {
        "rules": {
            "users": {
                ".write": true,
                "$uid": {
                    ".read": "auth != null && auth.uid == $uid"
                }
            }
        }
    }

With your Firebase instance id in hand, open **www/js/app.js** and find the following line:

    fb = new Firebase("https://INSTANCE_ID_HERE.firebaseio.com/");

You will want to replace **INSTANCE_ID_HERE** with your actual instance id.


## Usage

With this example project configured on your computer, run the following from the Terminal or command prompt:

    $ ionic build android

Install the application binary to your device or simulator.

The application is currently composed of six parts:

1. Firebase sign in
2. Master password creation
3. Master password unlocking
4. Password categories
5. Password lists
6. Password creation and viewing

You will be required to sign in to Firebase to use this application.  There is no offline compatibility in the current release.

Passwords are encrypted before storing on Firebase and transferred over a secure HTTPS connection.


## Have a question or found a bug (compliments work too)?

Tweet me on Twitter - [@nraboy](https://www.twitter.com/nraboy)


## Resources

Nic Raboy's Code Blog - [https://blog.nraboy.com](https://blog.nraboy.com)

Ionic Framework - [http://www.ionicframework.com](http://www.ionicframework.com)

AngularJS - [http://www.angularjs.org](http://www.angularjs.org)

Apache Cordova - [http://cordova.apache.org](http://cordova.apache.org)
