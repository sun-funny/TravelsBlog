export interface IUserRules {
  readonly path: string,
  readonly rules: {
    readonly read: boolean,
    readonly write: boolean
  }
}

export const UserRules: Readonly<IUserRules[]> = [
  {
    path: 'travels/faq',
    rules: {
      write: true,
      read: true
    }, 
  },
  {
    path: '/travels/settings/',
    rules: {
      write: true,
      read: true
    }
  }
]


