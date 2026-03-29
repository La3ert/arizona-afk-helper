import Title from '../components/Title.jsx';
import GameConnect from '../components/settings/GameConnect.jsx';
import UiLanguage from '../components/settings/UILanguage.jsx';

export default function Settings() {
  return (
    <div className='settings-page'>
      <Title title={'Settings'} />
      <GameConnect />
      <UiLanguage />
    </div>
  );
}
