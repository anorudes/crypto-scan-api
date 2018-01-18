export default function (text) {
  // Remove all html tags

  return text.replace(/<\/?[^>]+(>|$)/g, '');
};
