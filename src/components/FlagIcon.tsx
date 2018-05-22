import * as React from 'react';
import * as classNames from 'classnames';
import { withStyles, WithStyles } from '@material-ui/core/styles';
import { CountryCode } from '../utils/i18n';

type FlagIconClassKey =
  | 'root';

const stylesDecorator = withStyles<FlagIconClassKey>(
  {
    root: {
      width: 30,
      height: 18,
      borderRadius: 3,
      backgroundSize: 'cover',
      backgroundRepeat: 'no-repeat',
      backgroundPosition: 'center',
    },
  },
  { name: 'AccountIcon' }
);

const countryFlags: {
  [P in CountryCode]: string;
} = {
  de: require('svg-country-flags/svg/de.svg'),
  gb: require('svg-country-flags/svg/gb.svg'),
  es: require('svg-country-flags/svg/es.svg'),
  ee: require('svg-country-flags/svg/ee.svg'),
  fr: require('svg-country-flags/svg/fr.svg'),
  hu: require('svg-country-flags/svg/hu.svg'),
  nl: require('svg-country-flags/svg/nl.svg'),
  pl: require('svg-country-flags/svg/pl.svg'),
  ro: require('svg-country-flags/svg/ro.svg'),
  ru: require('svg-country-flags/svg/ru.svg'),
  ua: require('svg-country-flags/svg/ua.svg'),
  cn: require('svg-country-flags/svg/cn.svg'),
};

interface Props {
  className?: string;
  countryCode: CountryCode;
}

type DecoratedProps = Props & WithStyles<FlagIconClassKey>;

const FlagIcon = stylesDecorator<Props>(
  class extends React.Component<DecoratedProps> {
    render() {
      const {
        classes,
        className: classNameProp,
        countryCode,
      } = this.props;
      return (
        <div
          className={classNames(classes.root, classNameProp)}
          style={{ backgroundImage: `url(${countryFlags[countryCode]})` }}
        />
      );
    }
  }
);

export default FlagIcon;
