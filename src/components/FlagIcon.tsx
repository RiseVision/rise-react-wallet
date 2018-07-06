import * as React from 'react';
import * as classNames from 'classnames';
import { createStyles, withStyles, WithStyles } from '@material-ui/core/styles';
import { CountryCode } from '../utils/i18n';

const styles = createStyles({
  root: {
    width: 30,
    height: 18,
    borderRadius: 3,
    backgroundSize: 'cover',
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'center',
  },
});

const countryFlags: {
  [P in CountryCode]: string;
} = {
  gb: require('svg-country-flags/svg/gb.svg'),
  ee: require('svg-country-flags/svg/ee.svg'),
  kr: require('svg-country-flags/svg/kr.svg'),
};

interface Props extends WithStyles<typeof styles> {
  className?: string;
  countryCode: CountryCode;
}

const stylesDecorator = withStyles(styles, { name: 'AccountIcon' });

const FlagIcon = stylesDecorator(
  class extends React.Component<Props> {
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
