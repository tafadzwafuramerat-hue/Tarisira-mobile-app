export type Lang = 'en' | 'sn';

const en = {
  welcome: 'Welcome back', signin: 'Sign in to your account',
  phoneEmail: 'Phone or Email', password: 'Password', forgot: 'Forgot password?',
  login: 'Login', or: 'or', create: 'Create Account', newTo: 'New to Tarisira?',
  signupFree: 'Sign up free', back: 'Back', cont: 'Continue',
  createTitle: 'Create Account', personal: 'Enter your personal details',
  fullName: 'Full Name', phone: 'Phone Number', agree: "I agree to Tarisira's",
  tos: 'Terms of Service', and: 'and', pp: 'Privacy Policy', have: 'Already have an account?',
  bizTitle: 'Your Business', bizSub: 'Tell us about your business',
  bizName: 'Business Name', bizType: 'Business Type', location: 'Location',
  sizeTitle: 'Business Size', sizeSub: 'How many people work in your business?',
  justMe: 'Just me', p25: '2 – 5 people', p610: '6 – 10 people', p10: 'More than 10',
  curTitle: 'Currency', curSub: 'What currency does your business use?',
  multi: 'You can select more than one', finish: 'Finish Setup',
  done: "You're all set!", trial: 'Your Tarisira free trial starts today.',
  plan: 'YOUR PLAN', free: '2 MONTHS FREE', after: 'After your trial',
  price: '$3 / month', cancel: 'Cancel anytime · No hidden fees', dash: 'Go to Dashboard',
};

const sn: typeof en = {
  welcome: 'Titambire zvakare', signin: 'Pinda muaccount yako',
  phoneEmail: 'Nhamba kana Email', password: 'Password', forgot: 'Wakangwara password?',
  login: 'Pinda', or: 'kana', create: 'Vhura Account', newTo: 'Muri mutsva paTarisira?',
  signupFree: 'Nyoresa mahara', back: 'Dzokera', cont: 'Enderera',
  createTitle: 'Vhura Account', personal: 'Nyora mazita ako',
  fullName: 'Mazita Akazara', phone: 'Nhamba yeFoni', agree: 'Ndinobvuma',
  tos: 'Mitemo yeTarisira', and: 'ne', pp: 'Zvakavanzika', have: 'Une account here?',
  bizTitle: 'Bhizinesi Rako', bizSub: 'Tiudze nezvebhizinesi rako',
  bizName: 'Zita reBhizinesi', bizType: 'Rudzi rweBhizinesi', location: 'Kwaunoshanda',
  sizeTitle: 'Kukura kweBhizinesi', sizeSub: 'Vangani vanoshanda mubhizinesi rako?',
  justMe: 'Ndoga', p25: 'Vanhu 2 – 5', p610: 'Vanhu 6 – 10', p10: 'Vanopfuura 10',
  curTitle: 'Mari', curSub: 'Bhizinesi rako rinoshandisa mari ipi?',
  multi: 'Unogona kusarudza yakawanda', finish: 'Pedza Kuseta',
  done: 'Zvese zvaita!', trial: 'Free trial yako yeTarisira inotanga nhasi.',
  plan: 'PLAN YAKO', free: 'MWEDZI MIVIRI MAHARA', after: 'Mushure metrial',
  price: '$3 / mwedzi', cancel: 'Kanzura chero nguva · Hapana mari yakavanzika', dash: 'Enda kuDashboard',
};

export const STR = { en, sn };
export type Strings = typeof en;
