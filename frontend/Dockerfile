FROM --platform=linux/amd64 node:20-alpine

# git과 sudo, 필수 빌드 도구 설치
RUN apk add --no-cache git sudo

# node 사용자에게 비밀번호 없는 sudo 권한 부여
RUN echo "node ALL=(ALL) NOPASSWD:ALL" > /etc/sudoers.d/node \
    && chmod 0440 /etc/sudoers.d/node

WORKDIR /workspace/boookntalk

# 권한 설정 (작업 디렉토리 소유권 변경)
RUN chown -R node:node /workspace/boookntalk

USER node

# 컨테이너가 바로 꺼지지 않게 유지
CMD ["sh", "-c", "npm install && npm run dev"]