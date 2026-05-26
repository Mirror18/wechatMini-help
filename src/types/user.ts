export interface UserProfile {
  _id: string
  openid: string
  nickname: string
  avatar: string
  dailyCalorieGoal: number
  createdAt: Date
  updatedAt: Date
}

export interface UserState {
  openid: string
  profile: UserProfile | null
  isLoggedIn: boolean
  loading: boolean
}
