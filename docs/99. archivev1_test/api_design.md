# TAMMY API Design (v3)

본 문서는 TAMMY 서비스의 대화 중심 UX(v3) 및 데이터베이스 스키마(v3)를 지원하기 위한 백엔드 API 설계서입니다.
본 API는 tsoa(TypeScript OpenAPI) 프레임워크를 기반으로 작성될 수 있도록 설계되었습니다.

---

## 1. API 디자인 철학 및 흐름 (v3 대화 중심)

v3에서는 사용자가 직접 기록을 생성하는 것 외에도, **채팅창에서의 자연어 발화**가 핵심 입력 수단이 됩니다.
1. 사용자가 "/chat" API로 메시지("오늘 스쿼트 30분 완료!")를 보냅니다.
2. AI 에이전트가 이를 해석하여 의도를 분류합니다.
3. 의도에 따라 데이터베이스에 운동 기록(`exercise_logs`), 수분 기록(`water_logs`) 등을 백엔드 서비스 레이어에서 자동 적재합니다.
4. 백엔드는 대화 응답(`reply`)과 함께 수행된 동작(`actions`) 목록 및 업데이트된 상태(우주여행 연료 등)를 응답으로 보냅니다.
5. 프론트엔드는 이 `actions`를 기반으로 화면의 UI 컴포넌트(활동 로그, 수분 잔 수, 우주선 위치 등)를 즉시 실시간 업데이트합니다.

---

## 2. API 엔드포인트 목록

### 2.1 대화 및 AI 에이전트 API

* **POST /ai/chat**
  * **설명**: 사용자의 대화 메시지를 수신하여 AI의 답변을 생성하고, 발화에 포함된 데이터 기록(운동, 식단, 수분, 감정 등)을 처리한 뒤 액션 리스트를 반환합니다.
  * **요청 (JSON)**:
    ```json
    {
      "message": "오늘 플랭크 30분 하고 물 한잔 마셨어!"
    }
    ```
  * **응답 (JSON)**:
    ```json
    {
      "reply": "플랭크 30분 완료했구나! 물도 챙겨 마시다니 정말 훌륭해. 운동 기록에 추가하고 우주 연료 10을 더 채워넣었어! 🚀",
      "actions": [
        {
          "type": "LOG_WORKOUT",
          "payload": {
            "exerciseName": "플랭크",
            "durationMinutes": 30,
            "burnedCaloriesKcal": 150
          }
        },
        {
          "type": "LOG_WATER",
          "payload": {
            "intakeMl": 250
          }
        }
      ],
      "memory": {
        "recentExercise": "플랭크",
        "waterIntakeTodayMl": 250
      }
    }
    ```

---

### 2.2 식단 분석 API

* **POST /food/analyze**
  * **설명**: 사용자가 업로드한 식단 이미지(Multipart Form)를 AI Vision으로 분석하여 음식 정보 및 영양성분 데이터를 추출하고 데이터베이스에 기록합니다.
  * **요청 (Multipart Form)**:
    * `image`: File (음식 이미지)
    * `mealType`: 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK'
  * **응답 (JSON)**:
    ```json
    {
      "mealId": 42,
      "foodName": "닭가슴살 샐러드와 아보카도",
      "caloriesKcal": 350,
      "carbohydrateG": 15.0,
      "proteinG": 28.0,
      "fatG": 12.0,
      "comment": "단백질 비율이 아주 훌륭한 식사야! 아보카도의 좋은 지방도 포함되어 있어."
    }
    ```

---

### 2.3 AI 운동 추천 API

* **GET /exercise/recommend**
  * **설명**: 사용자의 신체 로그 및 운동 선호도를 바탕으로 AI 추천 운동 계획을 제공합니다.
  * **요청 (Query)**:
    * `userId`: number (로그인 사용자 ID)
  * **응답 (JSON)**:
    ```json
    {
      "title": "타미와 함께하는 하체 불태우기 코스 🔥",
      "totalMinutes": 25,
      "totalCalories": 200,
      "difficulty": "MEDIUM",
      "exercises": [
        {
          "name": "스쿼트",
          "sets": 3,
          "reps": 15,
          "estimatedCaloriesKcal": 80
        },
        {
          "name": "런지",
          "sets": 3,
          "reps": 12,
          "estimatedCaloriesKcal": 70
        },
        {
          "name": "플랭크",
          "sets": 3,
          "durationSeconds": 60,
          "estimatedCaloriesKcal": 50
        }
      ]
    }
    ```

---

### 2.4 AI 건강 리포트 API

* **GET /reports/monthly**
  * **설명**: 특정 년월의 건강 데이터를 종합 분석하여 온디맨드 리포트를 생성합니다.
  * **요청 (Query)**:
    * `yearMonth`: string (형식: "YYYY-MM")
  * **응답 (JSON)**:
    ```json
    {
      "healthScore": 85,
      "summaryContent": "이번 달은 전반적으로 규칙적인 유산소 운동이 돋보였습니다. 다만, 탄수화물 섭취 비율이 다소 높으니 다음 달에는 단백질 섭취를 조금 더 늘려보세요.",
      "dailyKcal": [
        { "date": "2026-07-01", "kcal": 2100 },
        { "date": "2026-07-02", "kcal": 1950 }
      ],
      "macros": {
        "carbohydrateG": 240,
        "proteinG": 85,
        "fatG": 55
      },
      "weeklyWorkoutMin": [
        { "week": "1주차", "minutes": 120 },
        { "week": "2주차", "minutes": 150 }
      ],
      "aiFindings": [
        "탄수화물 섭취가 평소 대비 15% 증가하여 오후에 피로감을 느꼈을 수 있습니다.",
        "수분 섭취량이 주 평균 1.5L로 목표(2L)에 근접하고 있습니다."
      ]
    }
    ```

---

### 2.5 우주여행 및 연료 API

* **GET /travel/state**
  * **설명**: 현재 사용자의 우주선 좌표, 보유 연료, 도달한 행성 등 우주여행 상태를 조회합니다.
  * **응답 (JSON)**:
    ```json
    {
      "currentFuel": 65,
      "shipCoordinateX": 12.3456,
      "shipCoordinateY": 78.9012,
      "currentPlanetId": 2,
      "currentPlanetName": "근육 불끈 행성 💪"
    }
    ```

* **POST /travel/fuel**
  * **설명**: 특정 미션 완료에 따른 연료 추가 보상을 처리합니다.
  * **요청 (JSON)**:
    ```json
    {
      "triggerType": "FOOD_ANALYZED" | "WORKOUT_DONE" | "GOAL_ACHIEVED"
    }
    ```
  * **응답 (JSON)**:
    ```json
    {
      "addedFuel": 5,
      "currentFuel": 70,
      "planetArrived": false,
      "arrivalOverlay": null
    }
    ```

---

## 3. 프론트엔드 연동 액션(Action) 타입 정의

POST `/ai/chat`에서 전달할 수 있는 액션의 타입 규격입니다.

* `LOG_WORKOUT`: 운동 정보 기록
* `LOG_MEAL`: 식사 정보 기록
* `LOG_WATER`: 수분 섭취량 기록
* `LOG_EMOTION`: 기분/감정 기록
* `ADD_FUEL`: 우주선 연료 지급
* `UPDATE_MEMORY`: 장기기억 업데이트
