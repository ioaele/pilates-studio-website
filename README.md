# pilates-studio-website

REFORMA FLOW PILATES BOOKING WEB APP

This repository contains a simple web application for an online booking system for the Reforma Flow Pilates studio.
Users can create an account, log in, view available sessions on a calendar, book lessons, view or manage their bookings, and admins can manage sessions through a dashboard.

The application is built with HTML, CSS, JavaScript, PHP and TSQL.

HOW THE APP WORKS 

The entry point of the website is main.php or main.html.

From the main page, users can:
• Read information about the studio and instructor
• Navigate to Book Now (booking calendar)
• Go to FAQ and About Us
• Log in or sign up via the profile icon
• If logged in, access My Bookings

User accounts and bookings are stored in a TSQL database.
PHP scripts handle user authentication, creating and deleting bookings, viewing bookings, and admin session management.

Frontend: HTML5, CSS3, JavaScript
Backend: PHP
Database: TSQL with stored procedures

SETUP AND INSTALLATION

Prerequisites:

PHP 7 or 8

TSQL server

XAMPP or similar local web server

STEP 1 – Clone or copy the project
Place the project folder inside your web server directory 
htdocs/reforma_flow

STEP 2 – Create the database

Log into SQL Management Studio 2022

Create a database

Import the DDL queries to create tables

Import the stored procedures

STEP 3 – Open in browser 
Open in your browser http://localhost:/reforma_flow/pilates.html
