import MuiDialog from '@material-ui/core/Dialog';
import {
  createStyles,
  Theme,
  WithStyles,
  withStyles
} from '@material-ui/core/styles';
import * as React from 'react';
import { ReactElement, ReactEventHandler } from 'react';
import ModalPaperHeader from './ModalPaperHeader';
import autoId from '../utils/autoId';
import { PropsOf } from '../utils/metaTypes';

const styles = (theme: Theme) => createStyles({
});

type BaseProps = PropsOf<typeof MuiDialog>
  & WithStyles<typeof styles>;

interface Props extends BaseProps {
  onNavigateBack?: ReactEventHandler<{}>;
  children: ReactElement<DialogContentProps>;
}

interface State {
  title: string | JSX.Element;
  childContentId: null | string;
}

const stylesDecorator = withStyles(styles);

class Dialog extends React.PureComponent<Props, State> {
  @autoId dialogTitleId: string;
  @autoId dialogContentId: string;

  state = {
    title: '',
    childContentId: null,
  };

  setDialogContent = (dc: DialogContent) => {
    this.setState({
      title: dc.title,
      childContentId: dc.contentId || null,
    });
  }

  render() {
    const { onClose, onNavigateBack, children, ...others } = this.props;
    const { title, childContentId } = this.state;

    return (
      <MuiDialog
        aria-labelledby={this.dialogTitleId}
        aria-describedby={childContentId || this.dialogContentId}
        onClose={onClose}
        {...others}
      >
        <ModalPaperHeader
          closeButton={!!onClose}
          onCloseClick={onClose}
          backButton={!!onNavigateBack}
          onBackClick={onNavigateBack}
          children={title}
        />
        <div
          id={this.dialogContentId}
          key={children.key !== null ? children.key : undefined}
        >
          {React.cloneElement(children, {
            setDialogContent: this.setDialogContent,
          })}
        </div>
      </MuiDialog>
    );
  }
}

export default stylesDecorator(Dialog);

export interface DialogContentProps {
  setDialogContent?: (value: DialogContent) => void;
}

export interface DialogContent {
  title: string | JSX.Element;
  contentId?: null | string;
}

export function SetDialogContent(
  component: React.Component<DialogContentProps>,
  content: DialogContent
) {
  const { setDialogContent } = component.props;

  if (setDialogContent) {
    setDialogContent(content);
  }
}

const contentStyles = (theme: Theme) => createStyles({
  content: {
    padding: theme.spacing.unit * 2,
    textAlign: 'center',
    '& p': {
      marginBottom: 0
    }
  },
});

type BaseLegacyContentProps = WithStyles<typeof contentStyles>
  & DialogContentProps;

interface LegacyContentProps extends BaseLegacyContentProps {
  title: JSX.Element;
}

export const LegacyContent = withStyles(contentStyles)(
  class extends React.Component<LegacyContentProps> {
    componentWillMount() {
      const { title } = this.props;
      SetDialogContent(this, { title });
    }

    render() {
      const { classes, children } = this.props;

      return (
        <div
          className={classes.content}
          children={children}
        />
      );
    }
  }
);
