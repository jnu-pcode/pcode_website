# docker-challenges/xss-lab/Dockerfile

# 가벼운 웹 서버 이미지 (nginx)를 사용
FROM nginx:stable-alpine

# index.html 파일을 컨테이너의 기본 웹 루트로 복사
COPY index.html /usr/share/nginx/html/

# nginx.conf 파일을 컨테이너의 설정 경로로 복사
COPY nginx.conf /etc/nginx/nginx.conf

# 80번 포트 노출
EXPOSE 80