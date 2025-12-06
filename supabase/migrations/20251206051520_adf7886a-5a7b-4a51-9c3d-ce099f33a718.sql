-- Create psx_trades table for Pakistan Stock Exchange trades
CREATE TABLE public.psx_trades (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    sno SERIAL,
    user_id UUID NOT NULL,
    strategy TEXT,
    stock_symbol TEXT NOT NULL,
    shares_purchased INTEGER NOT NULL,
    entry_price DECIMAL(12, 2) NOT NULL,
    trade_logic TEXT,
    tp_exit_price DECIMAL(12, 2),
    profit_loss DECIMAL(12, 2) GENERATED ALWAYS AS (
        CASE 
            WHEN tp_exit_price IS NOT NULL 
            THEN (tp_exit_price - entry_price) * shares_purchased 
            ELSE NULL 
        END
    ) STORED,
    result TEXT GENERATED ALWAYS AS (
        CASE 
            WHEN tp_exit_price IS NULL THEN 'pending'
            WHEN tp_exit_price > entry_price THEN 'win'
            WHEN tp_exit_price < entry_price THEN 'loss'
            ELSE 'breakeven'
        END
    ) STORED,
    trade_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.psx_trades ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own psx trades" 
ON public.psx_trades 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own psx trades" 
ON public.psx_trades 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own psx trades" 
ON public.psx_trades 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own psx trades" 
ON public.psx_trades 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_psx_trades_updated_at
BEFORE UPDATE ON public.psx_trades
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();