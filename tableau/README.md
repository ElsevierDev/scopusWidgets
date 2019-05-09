This folder contains a Tableau Web Data Connector to communicate with Scopus API and feed data in your Tableau projects.

Requirements:
- A Tableau license allowing you to use Web Data Connectors
- A Scopus API Key. Available on https://dev.elsevier.com/ 
- Optional: a web server so you can host this file on your own server (useful if you want to do things like hardcoding API Key in your HTML/JS code)

Steps:
- Open Tableau
- Go to "Data Source"
- Select "Web Data Connector"
- Enter https://elsevierdev.github.io/scopusWidgets/tableau/documents.html (or your own hosted file) in the address bar

![](/tableau/screenshots/tableauConfiguration.png?raw=true "")

- Fill in parameters:
  - document search query
  - number of documents retrieved (could take several minutes if you ask for a lot of data)
  - API key
- Click on "Get Data"
- Click on "Update Now"
- Have fun building your own Tableau Widgets and Dashboard leveraging Scopus data!

The following screenshot shows a Tableau Dashboard which uses this Web Data Connector to analyze key impactful authors and main subject areas based on a search query:

![](/tableau/screenshots/tableauDashboard.png?raw=true "")
