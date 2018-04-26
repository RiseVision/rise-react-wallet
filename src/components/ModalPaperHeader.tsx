import * as React from 'react';
import Button from 'material-ui/Button';
import Typography from 'material-ui/Typography';
import KeyboardArrowLeft from '@material-ui/icons/KeyboardArrowLeft';
import * as classNames from 'classnames';
import { withStyles, WithStyles } from 'material-ui/styles';

type ModalPaperHeaderClassKey =
  | 'root'
  | 'content'
  | 'backButton'
  | 'withBack';

const stylesDecorator = withStyles<ModalPaperHeaderClassKey>(
  (theme) => {
    return {
      root: {
        borderTopLeftRadius: 2, // Needs to match that of <Paper />
        borderTopRightRadius: 2, // Needs to match that of <Paper />
        backgroundColor: '#f6f6f6',
        display: 'flex',
      },
      content: {
        flex: 1,
        paddingTop: 10,
        paddingBottom: 10,
      },
      withBack: {
        marginRight: theme.spacing.unit * 8, // Width of the back button
      },
      backButton: {
        borderTopRightRadius: 0,
        borderBottomLeftRadius: 0,
        borderBottomRightRadius: 0,
      },
    };
  },
  { name: 'ModalPaperHeader' }
);

interface Props {
  backButton?: boolean;
  onBackClick?: () => void;
}

type DecoratedProps = Props & WithStyles<ModalPaperHeaderClassKey>;

const ModalPaperHeader = stylesDecorator<Props>(
  class extends React.Component<DecoratedProps> {
    handleBackClick = () => {
      if (this.props.onBackClick) {
        this.props.onBackClick();
      }
    }

    render() {
      const { classes, backButton, children } = this.props;
      return (
        <div className={classes.root}>
          {backButton && (
            <Button className={classes.backButton} onClick={this.handleBackClick} size="small">
              <KeyboardArrowLeft />
            </Button>
          )}
          <Typography
            className={classNames(
              classes.content,
              !!backButton && classes.withBack,
            )}
            variant="headline"
            align="center"
          >
            {children}
          </Typography>
        </div>
      );
    }
  }
);

export default ModalPaperHeader;
