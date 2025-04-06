# Docker | FastAPI

Build the Docker Image:
```
docker build -t dvc-app .
```

Run the container:
```
docker run -p 8000:8000 --name dvc-container dvc-app
```

To stop and start the container, do:
```
docker stop dvc-container
docker start dvc-container
```
