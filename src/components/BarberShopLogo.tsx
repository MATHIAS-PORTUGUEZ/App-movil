import { Image, View } from 'react-native';

type BarberShopLogoProps = {
  variant?: 'compact' | 'hero';
};

export function BarberShopLogo({
  variant = 'compact',
}: BarberShopLogoProps) {
  const isHero = variant === 'hero';

  return (
    <View
      className={`self-center overflow-hidden rounded-2xl border border-[#2E3450] bg-white ${
        isHero ? 'mb-5 h-[178px] w-full max-w-[280px]' : 'mb-5 h-24 w-40'
      }`}
    >
    
    
      <Image
        source={require('../../assets/istockphoto-1446474893-612x612.jpg')}
        accessibilityLabel="Logo de la barbería"
        resizeMode="cover"
        style={{ width: '100%', height: '100%' }}
      />
    </View>
  );
}

///Logo del home 