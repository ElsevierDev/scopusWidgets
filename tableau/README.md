This folder contains a Tableau Web Data Connector to communicate with Scopus API and feed data in your Tableau projects.

Requirements:
- A Tableau license allowing you to use Web Data Connectors
- A Scopus API Key. Available on https://dev.elsevier.com/ 
- Optional: a web server so you can host this file on your own server (useful if you want to do things like hardcoding API Key)

Steps:
- Open Tableau
- Go to data source
- Select Web Data Connector
- Point to https://elsevierdev.github.io/scopusWidgets/tableau/documents.html or your own hosted file
- Fill in parameters: search query, number of documents retrieved (could take several minutes if you ask for a lot of data) and API key
- Enjoy!

