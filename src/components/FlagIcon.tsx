import { createStyles, withStyles, WithStyles } from '@material-ui/core/styles';
import * as classNames from 'classnames';
import * as React from 'react';
import { CountryCode } from '../utils/i18n';

const styles = createStyles({
  root: {
    width: 30,
    height: 18,
    borderRadius: 3,
    backgroundSize: 'cover',
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'center'
  }
});

const countryFlags: { [P in CountryCode]: string } = {
  // de: require('svg-country-flags/svg/de.svg'),
  gb: require('svg-country-flags/svg/gb.svg'),
  // es: require('svg-country-flags/svg/es.svg'),
  ee: require('svg-country-flags/svg/ee.svg'),
  // fr: require('svg-country-flags/svg/fr.svg'),
  // it: require('svg-country-flags/svg/it.svg'),
  // hu: require('svg-country-flags/svg/hu.svg'),
  // nl: require('svg-country-flags/svg/nl.svg'),
  // pl: require('svg-country-flags/svg/pl.svg'),
  // ro: require('svg-country-flags/svg/ro.svg'),
  // ru: require('svg-country-flags/svg/ru.svg'),
  // ua: require('svg-country-flags/svg/ua.svg'),
  // cn: require('svg-country-flags/svg/cn.svg'),
};

interface Props extends WithStyles<typeof styles> {
  className?: string;
  countryCode: CountryCode;
}

const stylesDecorator = withStyles(styles, { name: 'AccountIcon' });

const FlagIcon = stylesDecorator(
  class extends React.Component<Props> {
    render() {
      const { classes, className: classNameProp, countryCode } = this.props;
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
