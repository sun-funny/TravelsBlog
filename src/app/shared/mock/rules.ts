export interface IUserRules {
  readonly path: string,
  readonly rules: {
    readonly read: boolean,
    readonly write: boolean
  }
}

export const UserRules: Readonly<IUserRules[]> = [
  {
    path: 'tickets/ticket-list',
    rules: {
      write: true,
      read: true
    }, 
  },
  {
    path: '/tickets/settings/',
    rules: {
      write: true,
      read: true
    }
  },
  {
    path: 'tickets/orders',
    rules: {
      write: true,
      read: true
    } 
  }
]


