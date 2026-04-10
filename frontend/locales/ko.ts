
import { TranslationSchema } from '../types';
import { koStyleNames, koSizeLabels } from './styleNames';

export const ko: TranslationSchema = {
  common: {
    generate: "생성",
    cancel: "취소",
    reset: "초기화",
    download: "다운로드",
    login: "로그인",
    register: "회원가입",
    logout: "로그아웃",
    profile: "프로필",
    settings: "설정",
    loading: "로딩 중...",
    error: "오류",
    success: "성공",
    close: "닫기",
    back: "뒤로",
    more: "더 보기",
    done: "완료",
    tryAgain: "다시 시도"
  },
  hero: {
    title: "AI로 창의력을 펼치세요",
    subtitle: "간단한 단어를 숨막히는 비주얼로 바꾸세요. 누구나 쉽게 사용할 수 있는 이미지 생성의 미래가 여기 있습니다.",
    cta: "지금 생성 시작하기",
    badge: "Gen-V 엔진 소개",
    learnMore: "더 알아보기"
  },
  features: {
    tag: "프로세스",
    title: "예술을 위한 설계",
    description: "단 몇 초 만에 컨셉에서 걸작으로. 클라우드 아키텍처가 복잡함을 처리하는 동안 당신은 창의적인 방향에 집중할 수 있습니다.",
    step1Title: "설명하기",
    step1Desc: "자연어를 사용하여 상상하는 것을 AI에게 정확하게 전달하세요.",
    step2Title: "다듬기",
    step2Desc: "고급 스타일 라이브러리와 프리셋을 사용하여 픽셀 단위로 조정하세요.",
    step3Title: "내보내기",
    step3Desc: "고해상도로 작품을 다운로드하고 세상과 공유하세요.",
  },
  generator: {
    promptPlaceholder: "원하는 이미지를 여기에 구체적으로 설명해 주세요. 예를 들어, '검은색 가죽으로 제작된 세련된 여성용 백팩을 대리석 받침대 위에 놓고 스튜디오 조명을 비춘 모습. 상단에 텍스트를 넣을 공간을 남겨주세요.'와 같이 작성할 수 있습니다.",
    helperText: "보고 싶은 내용을 간단한 단어로 설명하세요.",
    styles: "스타일",
    size: "크기",
    photos: "사진",
    aspectRatio: "가로세로비",
    quality: "품질",
    popularStyles: "인기",
    openLibrary: "스타일 라이브러리",
    uploadPhoto: "사진 업로드",
    photoLimit: "최대 {limit}장",
    photoInstructions: "생성의 참고용 사진을 업로드하세요.",
    photoUnavailable: "현재 모델은 사진 업로드를 지원하지 않습니다.",
    initializing: "엔진 초기화 중...",
    readyTitle: "시각화할 준비가 되셨나요?",
    crafting: "비전을 만드는 중",
    outOfBalance: "생성 횟수가 소진되었습니다. 충전해 주세요.",
    searchStyles: "스타일 검색...",
    noStylesFound: "스타일을 찾을 수 없음",
    defaultStyle: "스타일 없음",
    newGeneration: "새로운 생성",
    styleNames: koStyleNames,
    sizeLabels: koSizeLabels
  },
  history: {
    title: "생성 기록",
    empty: "저장된 생성물이 없습니다.",
    showMore: "전체 보기",
    modalTitle: "당신의 걸작",
    modalClose: "닫기",
    pageLabel: "페이지",
    prev: "이전",
    next: "다음",
    promptLabel: "요청",
    stylesLabel: "사용한 스타일",
    download: "다운로드",
    delete: "삭제",
    open: "확대",
    deleteConfirm: "이 기록을 삭제하시겠습니까?"
  },
  profile: {
    balance: "잔액",
    refill: "생성 횟수 추가",
    verified: "이메일 인증됨",
    notVerified: "이메일 미인증",
    resendEmail: "인증 메일 재전송",
    changePassword: "비밀번호 변경",
    buyGenerations: "패키지 구매",
    unitPrice: "단가",
    totalPrice: "합계",
    pay: "결제 완료",
    currency: "KRW",
    units: "개",
    historyTitle: "거래 내역",
    historyEmpty: "아직 구매 내역이 없습니다.",
    historyButton: "거래 내역 보기",
    historyDefaultComment: "생성 횟수 패키지",
    historyKinds: {
      purchase: "충전",
      trial: "보너스",
      refund: "환불",
      generation: "사용"
    }
    ,
    historyDescriptions: {
      purchase: "생성 횟수 패키지",
      trial: "웰컴 보너스",
      refund: "환불",
      generation: "생성 횟수 사용"
    },
    historyAmountLabel: "금액",
    changePasswordTitle: "비밀번호 변경",
    currentPassword: "현재 비밀번호",
    newPassword: "새 비밀번호",
    confirmPassword: "새 비밀번호 확인",
    changePasswordSubmit: "비밀번호 업데이트",
    passwordMismatch: "입력한 비밀번호가 일치하지 않습니다.",
    passwordChangeSuccess: "비밀번호가 변경되었습니다.",
    passwordChangeError: "비밀번호를 변경할 수 없습니다."
  },
  admin: {
    title: "Admin dashboard",
    subtitle: "Monitor users, balances, and transactions in one place.",
    usersTab: "Users",
    transactionsTab: "Transactions",
    filters: {
      email: "Email",
      role: "Role",
      status: "Status",
      search: "Search users",
      reset: "Clear filters"
    },
    headings: {
      email: "Email",
      balance: "Balance",
      role: "Role",
      status: "Status",
      actions: "Actions",
      created: "Created"
    },
    actions: {
      adjustBalance: "Adjust balance",
      toggleActive: "Disable",
      toggleInactive: "Enable",
      changeBalancePrompt: "Enter amount to add/subtract"
    },
    status: {
      active: "Active",
      inactive: "Suspended"
    },
    prompts: {
      balanceAmount: "Enter balance adjustment (+/-)",
      statusConfirm: "Confirm status change?"
    },
    pagination: {
      prev: "Prev",
      next: "Next",
      page: "Page"
    },
    notifications: {
      balanceUpdated: "Balance updated",
      statusUpdated: "Status updated",
      jobRerun: "작업이 다시 실행되었습니다",
      jobCancel: "작업이 취소되었습니다"
    },
    jobsTab: "작업",
    metricsTab: "메트릭",
    jobsTable: {
      title: "생성 작업",
      jobId: "작업 / 예약",
      statusLabel: "상태",
      userEmail: "사용자",
      created: "생성일",
      updated: "업데이트",
      actions: {
        rerun: "다시 실행",
        cancel: "취소"
      },
      empty: "작업이 없습니다"
    },
    billing: {
      title: "트랜잭션",
      filters: {
        kind: "유형"
      },
      totalAmount: "금액",
      totalCount: "건수",
      kindLabel: "유형",
      userLabel: "이메일",
      deltaLabel: "변동",
      amountLabel: "금액",
      createdLabel: "날짜",
      currency: "RUB",
      empty: "트랜잭션 없음"
    },
    metrics: {
      title: "인사이트",
      tagline: "실시간 지표",
      dailyGens: "생성 / 일",
      dailyRevenue: "수익 / 일",
      totalLabel: "주간 합계",
      apiErrors: "API 오류",
      failureRate: "실패율",
      backlogTitle: "대기열",
      reload: "자동 갱신"
    }
  },
  auth: {
    loginTitle: "다시 오신 것을 환영합니다",
    registerTitle: "NanoVisual 가입하기",
    loginSubtitle: "로그인하여 창작 여정을 계속하세요.",
    registerSubtitle: "계정을 만들고 무료 생성 횟수를 받으세요.",
    email: "이메일 주소",
    password: "비밀번호 (8자 이상)",
    noAccount: "계정이 없으신가요?",
    haveAccount: "이미 계정이 있으신가요?",
    or: "또는"
  }
  ,
  footer: {
    brand: "NanoVisual AI",
    privacy: "개인정보 처리방침",
    terms: "이용 약관",
    docs: "문서",
    support: "지원"
    ,
    supportTitle: "도움이 필요하신가요?",
    supportDescription: "문의 내용을 보내주시면 빠르게 답해드립니다.",
    supportEmailLabel: "이메일",
    supportEmail: "support@nanovisual.ai",
    supportClose: "닫기"
  },
  promo: {
    tagline: "지금 10,000+ 크리에이터와 함께 시작하세요",
    subtext: "빠르고 아름다운 이미지를 만드는 AI 스튜디오."
  }
};
