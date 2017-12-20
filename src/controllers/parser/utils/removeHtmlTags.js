// @flow

export default function (text: string = ''): string {
  // Remove all html tags

  return text.replace(/<\/?[^>]+(>|$)/g, '');
};
