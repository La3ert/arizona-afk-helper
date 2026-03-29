import Title from '../Title.jsx';

export default function UiLanguage() {
  return (
    <div className={'ui-language'}>
      <Title title={'Interface Language'} />
      <p className={'ui-language__description'}>Choose your language:</p>
      <div className={'ui-language__select-box'}>
        <select className={'ui-language__select'}>
          <option className={'ui-language__option'} value={'en'}>
            English
          </option>
          {/*<option className={'ui-language__option'} value={'ua'}>*/}
          {/*  Українська*/}
          {/*</option>*/}
          {/*<option className={'ui-language__option'} value={'ru'}>*/}
          {/*  Русский*/}
          {/*</option>*/}
        </select>
      </div>
    </div>
  );
}
