import CircularProgress, {
  CircularProgressProps
} from '@material-ui/core/CircularProgress';
import { createStyles, withStyles, WithStyles } from '@material-ui/core/styles';
import classNames from 'classnames';
import React from 'react';
import { defineMessages, InjectedIntlProps, injectIntl } from 'react-intl';

const styles = createStyles({
  root: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  progress: {}
});

type BaseProps = CircularProgressProps & WithStyles<typeof styles>;

interface Props extends BaseProps {}

type DecoratedProps = Props & InjectedIntlProps;

const stylesDecorator = withStyles(styles, { name: 'LoadingIndicator' });

const messages = defineMessages({
  loadingAriaLabel: {
    id: 'loading-indicator.loading-aria-label',
    description: 'Accessibility label for loading indicator',
    defaultMessage: 'Loading'
  }
});

class LoadingIndicator extends React.Component<DecoratedProps> {
  render() {
    const { intl, classes, className, ...other } = this.props;
    return (
      <div
        className={classes.root}
        aria-label={intl.formatMessage(messages.loadingAriaLabel)}
      >
        <CircularProgress
          className={classNames(classes.progress, className)}
          {...other}
        />
      </div>
    );
  }
}

export default stylesDecorator(injectIntl(LoadingIndicator));
